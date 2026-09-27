/**
 * WebSocket client to the local MCP server (npx nanothumbnail-mcp). Off until the user
 * pairs it; then it keeps reconnecting in the background, since the server comes and
 * goes with the agent's sessions.
 */
import { create } from 'zustand';
import { toast } from 'sonner';
import { t } from '../i18n';
import { useUI } from '../stores/ui';
import { runTool } from './tools';
import {
  CLOSE_BAD_TOKEN,
  CLOSE_REPLACED,
  DEFAULT_PORT,
  PROTOCOL_VERSION,
  parsePairing,
  type Pairing,
  type ServerMessage,
  type StudioMessage,
} from './protocol';

export type AgentStatus = 'off' | 'connecting' | 'connected' | 'waiting' | 'rejected' | 'replaced';

export interface AgentLogEntry {
  id: string;
  tool: string;
  startedAt: number;
  ms?: number;
  status: 'running' | 'ok' | 'error';
  detail?: string;
}

interface AgentState {
  enabled: boolean;
  port: number;
  token: string;
  status: AgentStatus;
  log: AgentLogEntry[];
  /** Pairing link opened by the agent, waiting for the user's approval. */
  pending: Pairing | null;

  init: () => void;
  pair: (pairing: Pairing) => void;
  disconnect: () => void;
  reconnect: () => void;
  approvePending: () => void;
  dismissPending: () => void;
  clearLog: () => void;
}

const STORAGE_KEY = 'nt_agent';
const LOG_SIZE = 50;
const RETRY_MS = [1000, 2000, 5000, 10_000];

function loadSaved(): { enabled: boolean; port: number; token: string } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return {
      enabled: saved.enabled === true && typeof saved.token === 'string',
      port: Number.isInteger(saved.port) ? saved.port : DEFAULT_PORT,
      token: typeof saved.token === 'string' ? saved.token : '',
    };
  } catch {
    return { enabled: false, port: DEFAULT_PORT, token: '' };
  }
}

function save(s: Pick<AgentState, 'enabled' | 'port' | 'token'>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ enabled: s.enabled, port: s.port, token: s.token }));
  } catch {
    /* storage unavailable */
  }
}

let socket: WebSocket | null = null;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let attempt = 0;

export const useAgent = create<AgentState>((set, get) => {
  function log(entry: AgentLogEntry) {
    const rest = get().log.filter((e) => e.id !== entry.id);
    set({ log: [entry, ...rest].slice(0, LOG_SIZE) });
  }

  function stop() {
    clearTimeout(retryTimer);
    const s = socket;
    socket = null;
    s?.close();
  }

  function scheduleRetry() {
    clearTimeout(retryTimer);
    if (!get().enabled) return;
    const delay = RETRY_MS[Math.min(attempt, RETRY_MS.length - 1)];
    attempt++;
    set({ status: 'waiting' });
    retryTimer = setTimeout(connect, delay);
  }

  async function handleCall(s: WebSocket, id: string, tool: string, args: Record<string, unknown>) {
    const startedAt = Date.now();
    log({ id, tool, startedAt, status: 'running' });
    const result = await runTool(tool, args);
    const first = result.content.find((c) => c.type === 'text');
    log({
      id,
      tool,
      startedAt,
      ms: Date.now() - startedAt,
      status: result.isError ? 'error' : 'ok',
      detail: result.isError && first?.type === 'text' ? first.text : undefined,
    });
    if (s.readyState === WebSocket.OPEN) s.send(JSON.stringify({ type: 'result', id, result } satisfies StudioMessage));
  }

  function connect() {
    const { enabled, port, token } = get();
    if (!enabled || socket) return;
    if (get().status !== 'waiting') set({ status: 'connecting' });
    let s: WebSocket;
    try {
      s = new WebSocket(`ws://127.0.0.1:${port}`);
    } catch {
      return scheduleRetry();
    }
    socket = s;
    s.onopen = () => s.send(JSON.stringify({ type: 'hello', token, protocol: PROTOCOL_VERSION } satisfies StudioMessage));
    s.onmessage = (event) => {
      let msg: ServerMessage;
      try {
        msg = JSON.parse(String(event.data));
      } catch {
        return;
      }
      if (msg.type === 'welcome') {
        attempt = 0;
        set({ status: 'connected' });
        toast.success(t('agent.connectedToast'));
      } else if (msg.type === 'call') {
        void handleCall(s, msg.id, msg.tool, msg.args ?? {});
      }
    };
    s.onclose = (event) => {
      if (socket !== s) return; // closed on purpose
      socket = null;
      const wasConnected = get().status === 'connected';
      if (event.code === CLOSE_BAD_TOKEN) return set({ status: 'rejected' });
      if (event.code === CLOSE_REPLACED) return set({ status: 'replaced' });
      if (wasConnected) toast(t('agent.disconnectedToast'));
      scheduleRetry();
    };
  }

  return {
    ...loadSaved(),
    status: 'off',
    log: [],
    pending: null,

    init: () => {
      const hash = typeof location !== 'undefined' ? location.hash : '';
      const pairing = hash.startsWith('#agent=') ? parsePairing(hash.slice('#agent='.length)) : null;
      if (pairing) {
        history.replaceState(null, '', location.pathname + location.search);
        const { enabled, port, token } = get();
        if (enabled && port === pairing.port && token === pairing.token) return get().reconnect();
        set({ pending: pairing });
        useUI.getState().open('agent');
      }
      if (get().enabled) connect();
    },

    pair: ({ port, token }) => {
      stop();
      attempt = 0;
      set({ enabled: true, port, token, pending: null, status: 'connecting' });
      save(get());
      connect();
    },

    disconnect: () => {
      stop();
      set({ enabled: false, status: 'off' });
      save(get());
    },

    reconnect: () => {
      stop();
      attempt = 0;
      set({ enabled: true, status: 'connecting' });
      save(get());
      connect();
    },

    approvePending: () => {
      const pending = get().pending;
      if (pending) get().pair(pending);
    },
    dismissPending: () => set({ pending: null }),
    clearLog: () => set({ log: [] }),
  };
});
