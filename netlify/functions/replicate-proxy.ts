const ALLOWED_ORIGINS = [
  'https://api.replicate.com',
  'https://generativelanguage.googleapis.com',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-goog-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export default async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const targetUrl = url.searchParams.get('url');

  if (!targetUrl) {
    return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Security: only allow proxying to whitelisted APIs
  if (!ALLOWED_ORIGINS.some((origin) => targetUrl.startsWith(origin))) {
    return new Response(JSON.stringify({ error: 'Forbidden: target URL is not allowed' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const headers: Record<string, string> = {};
  const auth = req.headers.get('authorization');
  const contentType = req.headers.get('content-type');
  const googApiKey = req.headers.get('x-goog-api-key');

  if (auth) headers['Authorization'] = auth;
  if (contentType) headers['Content-Type'] = contentType;
  if (googApiKey) headers['x-goog-api-key'] = googApiKey;

  try {
    const body = req.method !== 'GET' ? await req.text() : undefined;

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Proxy request failed', details: String(error) }), {
      status: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};
