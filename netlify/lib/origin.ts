/**
 * Origin allowlist shared by our functions: the production site, Netlify
 * deploy previews of this site, and local dev. Anything else is refused so the
 * functions can't be used as a free open proxy by third-party sites.
 */
const LOCAL_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function siteOrigins(): string[] {
  return [process.env.URL, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL]
    .filter((u): u is string => !!u)
    .map((u) => new URL(u).origin);
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (siteOrigins().includes(origin)) return true;
  if (process.env.CONTEXT === 'dev' || process.env.NETLIFY_DEV === 'true') return LOCAL_ORIGIN.test(origin);
  return false;
}

/**
 * Browsers send `Origin` on cross-origin requests and on same-origin POSTs, but
 * not on same-origin GETs; for those we fall back to `Sec-Fetch-Site`.
 */
export function isAllowedRequest(headers: Record<string, string | undefined>): boolean {
  const origin = headers.origin;
  if (origin) return isAllowedOrigin(origin);
  return headers['sec-fetch-site'] === 'same-origin';
}

export function corsHeaders(origin: string | undefined, methods: string, allowHeaders: string) {
  return {
    'Access-Control-Allow-Origin': origin && isAllowedOrigin(origin) ? origin : 'null',
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': allowHeaders,
    Vary: 'Origin',
  };
}
