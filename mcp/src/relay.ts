import { timingSafeEqual } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import {
  CLOSE_BAD_TOKEN,
  CLOSE_REPLACED,
  PROTOCOL_VERSION,
  type ServerMessage,
  type StudioMessage,
  type ToolResult,
} from '../../src/app/agent/protocol.ts';

interface Pending {
  resolve: (result: ToolResult) => void;
  reject: (error: Error) => void;
  timer: NodeJS.Timeout;
}

export class StudioNotConnected extends Error {}

function sameToken(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/**
 * WebSocket endpoint the studio tab connects to. Listens on loopback only, checks the
 * page origin, then the pairing token; one studio at a time (the newest tab wins).
 */
export class StudioRelay {
  private wss: WebSocketServer | null = null;
  private studio: WebSocket | null = null;
  private pending = new Map<string, Pending>();
  private waiters = new Set<() => void>();
  private seq = 0;
  listenError: Error | null = null;

  constructor(private readonly opts: { port: number; token: string; origins: string[]; host?: string }) {}

  get connected(): boolean {
    return this.studio !== null;
  }

  listen(): Promise<void> {
    return new Promise((resolve) => {
      const wss = new WebSocketServer({
        host: this.opts.host ?? '127.0.0.1',
        port: this.opts.port,
        maxPayload: 64 * 1024 * 1024,
        verifyClient: ({ req }: { req: IncomingMessage }) => this.opts.origins.includes(req.headers.origin ?? ''),
      });
      wss.on('listening', () => {
        this.wss = wss;
        resolve();
      });
      wss.on('error', (error) => {
        // EADDRINUSE: another agent session already runs a server on this port.
        this.listenError = error;
        resolve();
      });
      wss.on('connection', (socket) => this.accept(socket));
    });
  }

  private accept(socket: WebSocket) {
    let authed = false;
    const helloTimer = setTimeout(() => socket.close(CLOSE_BAD_TOKEN, 'hello expected'), 5000);

    socket.on('message', (raw) => {
      let msg: StudioMessage;
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }
      if (!authed) {
        clearTimeout(helloTimer);
        if (msg.type !== 'hello' || typeof msg.token !== 'string' || !sameToken(msg.token, this.opts.token)) {
          socket.close(CLOSE_BAD_TOKEN, 'bad token');
          return;
        }
        authed = true;
        const previous = this.studio;
        this.studio = socket;
        if (previous) {
          this.failPending(new StudioNotConnected('The studio was reopened in another tab.'));
          previous.close(CLOSE_REPLACED, 'replaced');
        }
        this.send(socket, { type: 'welcome', protocol: PROTOCOL_VERSION });
        this.waiters.forEach((w) => w());
        this.waiters.clear();
        return;
      }
      if (msg.type === 'result') {
        const p = this.pending.get(msg.id);
        if (!p) return;
        clearTimeout(p.timer);
        this.pending.delete(msg.id);
        p.resolve(msg.result);
      }
    });

    socket.on('close', () => {
      clearTimeout(helloTimer);
      if (this.studio === socket) {
        this.studio = null;
        this.failPending(new StudioNotConnected('The studio tab was closed or disconnected.'));
      }
    });
  }

  private send(socket: WebSocket, msg: ServerMessage) {
    socket.send(JSON.stringify(msg));
  }

  private failPending(error: Error) {
    for (const [id, p] of this.pending) {
      clearTimeout(p.timer);
      p.reject(error);
      this.pending.delete(id);
    }
  }

  /** Resolves true as soon as a studio is paired, false after `ms`. */
  waitForStudio(ms: number): Promise<boolean> {
    if (this.connected) return Promise.resolve(true);
    return new Promise((resolve) => {
      const done = () => {
        clearTimeout(timer);
        resolve(true);
      };
      const timer = setTimeout(() => {
        this.waiters.delete(done);
        resolve(false);
      }, ms);
      this.waiters.add(done);
    });
  }

  call(tool: string, args: Record<string, unknown>, timeoutMs = 5 * 60_000): Promise<ToolResult> {
    const studio = this.studio;
    if (!studio) return Promise.reject(new StudioNotConnected('The NanoThumbnail studio is not connected.'));
    const id = `c${++this.seq}`;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`The studio did not answer "${tool}" within ${Math.round(timeoutMs / 1000)} s.`));
      }, timeoutMs);
      this.pending.set(id, { resolve, reject, timer });
      this.send(studio, { type: 'call', id, tool, args });
    });
  }

  async close(): Promise<void> {
    this.failPending(new StudioNotConnected('Server shutting down.'));
    this.studio?.close();
    await new Promise<void>((resolve) => (this.wss ? this.wss.close(() => resolve()) : resolve()));
  }
}
