import type { Handler, HandlerEvent } from '@netlify/functions';

const ALLOWED_ORIGIN = 'https://api.replicate.com';

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Authorization, Content-Type',
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

  // Security: only allow proxying to Replicate API
  if (!targetUrl.startsWith(ALLOWED_ORIGIN)) {
    return {
      statusCode: 403,
      body: JSON.stringify({ error: 'Forbidden: only Replicate API is allowed' }),
    };
  }

  const headers: Record<string, string> = {};
  if (event.headers.authorization) {
    headers['Authorization'] = event.headers.authorization;
  }
  if (event.headers['content-type']) {
    headers['Content-Type'] = event.headers['content-type'];
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
