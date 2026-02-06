import type { Handler, HandlerEvent } from '@netlify/functions';

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
      body: '',
    };
  }

  const videoId = event.queryStringParameters?.videoId;

  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return {
      statusCode: 400,
      headers: { 'Access-Control-Allow-Origin': '*' },
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
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({ base64: `data:image/jpeg;base64,${base64}` }),
      };
    } catch {
      continue;
    }
  }

  return {
    statusCode: 404,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ error: 'Thumbnail not found' }),
  };
};
