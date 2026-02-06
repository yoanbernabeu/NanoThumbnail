import type { Handler, HandlerEvent } from '@netlify/functions';

const ALLOWED_ORIGINS = [
  'https://api.replicate.com',
  'https://generativelanguage.googleapis.com',
];

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type, x-goog-api-key',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: '',
    };
  }

  const targetUrl = event.queryStringParameters?.url;

  if (!targetUrl) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url parameter' }),
    };
  }

  // Security: only allow proxying to whitelisted APIs
  if (!ALLOWED_ORIGINS.some(origin => targetUrl.startsWith(origin))) {
    return {
      statusCode: 403,
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
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers,
      body: event.httpMethod !== 'GET' ? event.body : undefined,
    });

    const responseBody = await response.text();

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'application/json',
      },
      body: responseBody,
    };
  } catch (error) {
    return {
      statusCode: 502,
      body: JSON.stringify({ error: 'Proxy request failed', details: String(error) }),
    };
  }
};
