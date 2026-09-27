import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { DEFAULT_PORT } from '../../src/app/agent/protocol.ts';

export interface Config {
  port: number;
  /** Studio page opened for pairing. */
  studioUrl: string;
  /** Origins allowed to open the WebSocket (browsers always send one). */
  origins: string[];
  token: string;
}

const CONFIG_FILE = join(homedir(), '.config', 'nanothumbnail', 'mcp.json');

/** The token is kept across runs so the studio stays paired: agents restart the server every session. */
function persistentToken(): string {
  try {
    const saved = JSON.parse(readFileSync(CONFIG_FILE, 'utf8'));
    if (typeof saved.token === 'string' && /^[\w-]{32,128}$/.test(saved.token)) return saved.token;
  } catch {
    /* first run */
  }
  const token = randomBytes(24).toString('base64url');
  try {
    mkdirSync(dirname(CONFIG_FILE), { recursive: true, mode: 0o700 });
    writeFileSync(CONFIG_FILE, JSON.stringify({ token }, null, 2), { mode: 0o600 });
  } catch {
    /* read-only home: the token just won't survive a restart */
  }
  return token;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.NANOTHUMBNAIL_PORT) || DEFAULT_PORT;
  const studioUrl = env.NANOTHUMBNAIL_URL || 'https://nanothumbnail.com/app/';
  const origins = [
    new URL(studioUrl).origin,
    'https://nanothumbnail.com',
    'http://localhost:4321',
    'http://127.0.0.1:4321',
    'http://localhost:8888',
    ...(env.NANOTHUMBNAIL_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) ?? []),
  ];
  return { port, studioUrl, origins: [...new Set(origins)], token: env.NANOTHUMBNAIL_TOKEN || persistentToken() };
}
