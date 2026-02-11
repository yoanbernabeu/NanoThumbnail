import type { Handler, HandlerEvent } from '@netlify/functions';

const ALLOWED_ORIGINS = [
  'https://api.replicate.com',
  'https://generativelanguage.googleapis.com',
  'https://openrouter.ai',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-goog-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: corsHeaders, body: '' };
  }

  const targetUrl = event.queryStringParameters?.url;

  if (!targetUrl) {
    return {
      statusCode: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing url parameter' }),
    };
  }

  if (!ALLOWED_ORIGINS.some(origin => targetUrl.startsWith(origin))) {
    return {
      statusCode: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Forbidden: target URL is not allowed' }),
    };
  }

  const headers: Record<string, string> = {};
  if (event.headers.authorization) {
    headers['Authorization'] = event.headers.authorization;
  }
  if (event.headers['content-type']) {
    headers['Content-Type'] = event.headers['content-type'];
  }
  if (event.headers['x-goog-api-key']) {
    headers['x-goog-api-key'] = event.headers['x-goog-api-key'];
  }

  try {
    // Decode body if Netlify base64-encoded it
    let requestBody: string | undefined = undefined;
    if (event.httpMethod !== 'GET' && event.body) {
      requestBody = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf-8')
        : event.body;
    }

    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers,
      body: requestBody,
    });

    const responseBody = await response.text();

    return {
      statusCode: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
      body: responseBody || JSON.stringify({
        _proxy_debug: {
          upstreamStatus: response.status,
          upstreamStatusText: response.statusText,
          emptyBody: true,
          targetUrl,
          method: event.httpMethod,
          hasBody: !!requestBody,
          bodyLength: requestBody?.length || 0,
        }
      }),
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Proxy request failed', details: String(error) }),
    };
  }
};
