import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { HandlerEvent } from '@netlify/functions';
import { handler } from '../functions/replicate-proxy';

const SITE = 'https://nanothumbnail.com';
const CREATE = 'https://api.replicate.com/v1/models/google/nano-banana-pro/predictions';

function event(overrides: Partial<HandlerEvent> & { url?: string; origin?: string } = {}): HandlerEvent {
  const { url = CREATE, origin = SITE, ...rest } = overrides;
  return {
    httpMethod: 'POST',
    headers: { origin, authorization: 'Bearer r8_test', 'content-type': 'application/json' },
    queryStringParameters: { url },
    body: '{"input":{}}',
    isBase64Encoded: false,
    ...rest,
  } as HandlerEvent;
}

const call = (e: HandlerEvent) => handler(e, {} as never) as Promise<{ statusCode: number; headers: Record<string, string>; body: string }>;

describe('replicate-proxy', () => {
  beforeEach(() => {
    process.env.URL = SITE;
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"id":"abc"}', { status: 201, headers: { 'content-type': 'application/json' } })));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.URL;
  });

  it('relays allowed calls and echoes the site origin', async () => {
    const res = await call(event());
    expect(res.statusCode).toBe(201);
    expect(res.headers['Access-Control-Allow-Origin']).toBe(SITE);
    const [target, init] = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(target)).toBe(CREATE);
    expect(init.headers.Authorization).toBe('Bearer r8_test');
  });

  it('refuses other origins', async () => {
    const res = await call(event({ origin: 'https://evil.example' }));
    expect(res.statusCode).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('refuses hosts and routes outside the allowlist', async () => {
    for (const url of [
      'https://generativelanguage.googleapis.com/v1beta/models/x:generateContent',
      'https://api.replicate.com/v1/account',
      'https://api.replicate.com.evil.example/v1/models/a/b/predictions',
      'http://api.replicate.com/v1/models/a/b/predictions',
    ]) {
      expect((await call(event({ url }))).statusCode).toBe(403);
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('only allows GET on prediction polling', async () => {
    const url = 'https://api.replicate.com/v1/predictions/abc123';
    expect((await call(event({ url, httpMethod: 'GET', body: null }))).statusCode).toBe(201);
    expect((await call(event({ url, httpMethod: 'POST' }))).statusCode).toBe(403);
  });

  it('requires an Authorization header', async () => {
    const e = event();
    delete e.headers.authorization;
    expect((await call(e)).statusCode).toBe(401);
  });

  it('rejects oversized bodies', async () => {
    const res = await call(event({ body: 'x'.repeat(6_000_000) }));
    expect(res.statusCode).toBe(413);
  });
});
