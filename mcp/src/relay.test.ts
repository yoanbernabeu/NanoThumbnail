import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { StudioRelay } from './relay.ts';
import { CLOSE_BAD_TOKEN, CLOSE_REPLACED, parsePairing, type CallMessage } from '../../src/app/agent/protocol.ts';

const TOKEN = 'a'.repeat(32);
const ORIGIN = 'http://localhost:4321';
let relay: StudioRelay;
let port = 0;

async function start() {
  port = 20000 + Math.floor(Math.random() * 20000);
  relay = new StudioRelay({ port, token: TOKEN, origins: [ORIGIN] });
  await relay.listen();
  expect(relay.listenError).toBeNull();
}

function studio(opts: { token?: string; origin?: string } = {}) {
  const ws = new WebSocket(`ws://127.0.0.1:${port}`, { origin: opts.origin ?? ORIGIN });
  const messages: unknown[] = [];
  ws.on('message', (raw) => messages.push(JSON.parse(String(raw))));
  const opened = new Promise<void>((resolve, reject) => {
    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'hello', token: opts.token ?? TOKEN, protocol: 1 }));
      resolve();
    });
    ws.on('error', reject);
  });
  const closed = new Promise<number>((resolve) => ws.on('close', (code) => resolve(code)));
  return { ws, messages, opened, closed };
}

afterEach(async () => {
  await relay?.close();
});

describe('StudioRelay', () => {
  it('relays a call to the paired studio and returns its result', async () => {
    await start();
    const s = studio();
    await s.opened;
    expect(await relay.waitForStudio(2000)).toBe(true);
    s.ws.on('message', (raw) => {
      const msg = JSON.parse(String(raw)) as CallMessage;
      if (msg.type === 'call') {
        s.ws.send(JSON.stringify({ type: 'result', id: msg.id, result: { content: [{ type: 'text', text: `${msg.tool}:${msg.args.x}` }] } }));
      }
    });
    const result = await relay.call('get_state', { x: 1 });
    expect(result.content[0]).toEqual({ type: 'text', text: 'get_state:1' });
    expect(s.messages[0]).toMatchObject({ type: 'welcome' });
  });

  it('refuses a wrong token', async () => {
    await start();
    const s = studio({ token: 'b'.repeat(32) });
    await s.opened;
    expect(await s.closed).toBe(CLOSE_BAD_TOKEN);
    expect(relay.connected).toBe(false);
  });

  it('refuses a foreign origin before the handshake', async () => {
    await start();
    const s = studio({ origin: 'https://evil.example' });
    await expect(s.opened).rejects.toThrow();
    expect(relay.connected).toBe(false);
  });

  it('keeps only the newest studio tab', async () => {
    await start();
    const first = studio();
    await first.opened;
    await relay.waitForStudio(2000);
    const second = studio();
    await second.opened;
    expect(await first.closed).toBe(CLOSE_REPLACED);
    expect(relay.connected).toBe(true);
  });

  it('fails calls when no studio is connected, and pending calls when it leaves', async () => {
    await start();
    await expect(relay.call('get_state', {})).rejects.toThrow(/not connected/);
    const s = studio();
    await s.opened;
    await relay.waitForStudio(2000);
    const call = relay.call('generate', {});
    s.ws.close();
    await expect(call).rejects.toThrow(/closed|disconnected/);
  });

  it('reports a busy port instead of crashing', async () => {
    await start();
    const other = new StudioRelay({ port, token: TOKEN, origins: [ORIGIN] });
    await other.listen();
    expect(other.listenError).toBeTruthy();
    await other.close();
  });
});

describe('parsePairing', () => {
  it('parses port:token codes', () => {
    expect(parsePairing(`17821:${TOKEN}`)).toEqual({ port: 17821, token: TOKEN });
    expect(parsePairing(` 17821:${TOKEN} `)).toEqual({ port: 17821, token: TOKEN });
  });
  it('rejects malformed codes', () => {
    expect(parsePairing('17821:short')).toBeNull();
    expect(parsePairing(`99999:${TOKEN}`)).toBeNull();
    expect(parsePairing(`17821:${TOKEN}/x`)).toBeNull();
    expect(parsePairing('')).toBeNull();
  });
});
