import type { Handler, HandlerEvent } from '@netlify/functions';
import { corsHeaders, isAllowedRequest } from '../lib/origin';

/**
 * Minimal Replicate proxy. Replicate's API has no browser CORS support, so the
 * app relays the few calls it needs through here. The user's key is forwarded
 * as-is and never logged or stored.
 *
 * Only these calls are relayed:
 *   POST /v1/models/{owner}/{name}/predictions   create
 *   GET  /v1/predictions/{id}                    poll
 *   POST /v1/predictions/{id}/cancel             cancel
 */
const ROUTES: Array<{ method: string; path: RegExp }> = [
  { method: 'POST', path: /^\/v1\/models\/[\w.-]+\/[\w.-]+\/predictions$/ },
  { method: 'GET', path: /^\/v1\/predictions\/\w+$/ },
  { method: 'POST', path: /^\/v1\/predictions\/\w+\/cancel$/ },
];

/** Netlify's synchronous function payload limit is ~6 MB. */
const MAX_BODY_BYTES = 5_500_000;

const json = (statusCode: number, body: unknown, headers: Record<string, string>) => ({
  statusCode,
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler: Handler = async (event: HandlerEvent) => {
  const cors = corsHeaders(event.headers.origin, 'GET, POST, OPTIONS', 'Authorization, Content-Type, Prefer');

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  if (!isAllowedRequest(event.headers)) {
    return json(403, { error: 'Origin not allowed' }, cors);
  }

  let target: URL;
  try {
    target = new URL(event.queryStringParameters?.url ?? '');
  } catch {
    return json(400, { error: 'Missing or invalid url parameter' }, cors);
  }

  const allowed =
    target.protocol === 'https:' &&
    target.hostname === 'api.replicate.com' &&
    ROUTES.some((r) => r.method === event.httpMethod && r.path.test(target.pathname));
  if (!allowed) {
    return json(403, { error: 'Target not allowed' }, cors);
  }

  const authorization = event.headers.authorization;
  if (!authorization) {
    return json(401, { error: 'Missing Authorization header' }, cors);
  }

  let body: string | undefined;
  if (event.httpMethod === 'POST' && event.body) {
    body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf-8') : event.body;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      return json(413, { error: 'Request too large. Use fewer or smaller reference images.' }, cors);
    }
  }

  const headers: Record<string, string> = { Authorization: authorization };
  if (body) headers['Content-Type'] = 'application/json';
  if (event.headers.prefer) headers.Prefer = event.headers.prefer;

  try {
    const response = await fetch(target, { method: event.httpMethod, headers, body });
    const text = await response.text();
    return {
      statusCode: response.status,
      headers: {
        ...cors,
        'Content-Type': response.headers.get('content-type') || 'application/json',
        'Cache-Control': 'no-store',
      },
      body: text || JSON.stringify({ error: `Empty upstream response (${response.status})` }),
    };
  } catch (error) {
    return json(502, { error: 'Upstream request failed', details: String(error) }, cors);
  }
};
