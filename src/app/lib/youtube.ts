import { dataUrlToBlob } from './images';

const ID_PATTERNS = [
  /(?:youtube\.com\/watch\?.*v=)([\w-]{11})/,
  /(?:youtu\.be\/)([\w-]{11})/,
  /(?:youtube\.com\/(?:embed|shorts|live)\/)([\w-]{11})/,
];

export function extractVideoId(url: string): string | null {
  const trimmed = url.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  for (const p of ID_PATTERNS) {
    const m = trimmed.match(p);
    if (m) return m[1];
  }
  return null;
}

export async function fetchVideoTitle(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data.title === 'string' ? data.title : null;
  } catch {
    return null;
  }
}

/** maxresdefault doesn't exist for every video; YouTube serves a 120×90 grey placeholder instead of a 404. */
function isPlaceholder(blob: Blob): boolean {
  return blob.size < 2000;
}

export async function fetchThumbnail(videoId: string): Promise<Blob | null> {
  for (const quality of ['maxresdefault', 'sddefault', 'hqdefault']) {
    try {
      const res = await fetch(`https://i.ytimg.com/vi/${videoId}/${quality}.jpg`);
      if (!res.ok) continue;
      const blob = await res.blob();
      if (!isPlaceholder(blob)) return blob;
    } catch {
      break; // CORS/network: fall through to the proxy
    }
  }
  try {
    const res = await fetch(`/.netlify/functions/youtube-thumbnail-proxy?videoId=${videoId}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.base64 ? dataUrlToBlob(data.base64) : null;
  } catch {
    return null;
  }
}
