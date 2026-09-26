import type { Handler, HandlerEvent } from '@netlify/functions';
import { corsHeaders, isAllowedRequest } from '../lib/origin';

export const handler: Handler = async (event: HandlerEvent) => {
  const cors = corsHeaders(event.headers.origin, 'GET, OPTIONS', 'Content-Type');

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }

  if (!isAllowedRequest(event.headers)) {
    return { statusCode: 403, headers: cors, body: JSON.stringify({ error: 'Origin not allowed' }) };
  }

  const videoId = event.queryStringParameters?.videoId;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      statusCode: 400,
      headers: cors,
      body: JSON.stringify({ error: 'Missing or invalid videoId parameter' }),
    };
  }

  const qualities = ['maxresdefault', 'hqdefault'];

  for (const quality of qualities) {
    try {
      const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
      const response = await fetch(url);

      if (!response.ok) continue;

      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');

      return {
        statusCode: 200,
        headers: {
          ...cors,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ base64: `data:image/jpeg;base64,${base64}` }),
      };
    } catch {
      continue;
    }
  }

  return {
    statusCode: 404,
    headers: cors,
    body: JSON.stringify({ error: 'Thumbnail not found' }),
  };
};
