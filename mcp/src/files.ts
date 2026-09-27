import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, isAbsolute, join, resolve } from 'node:path';

const MAX_BYTES = 20 * 1024 * 1024;
const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.avif': 'image/avif',
};

export interface LoadedImage {
  data: string;
  mimeType: string;
  name: string;
}

/** A reference image from disk or the web, base64-encoded for the studio. */
export async function loadImage(source: { path?: string; url?: string }): Promise<LoadedImage> {
  if (!!source.path === !!source.url) throw new Error('Pass exactly one of "path" or "url".');

  if (source.path) {
    if (!isAbsolute(source.path)) throw new Error('"path" must be absolute.');
    const mimeType = MIME[extname(source.path).toLowerCase()];
    if (!mimeType) throw new Error(`Unsupported image type: ${extname(source.path) || '(none)'}`);
    const info = await stat(source.path);
    if (info.size > MAX_BYTES) throw new Error('Image larger than 20 MB.');
    const bytes = await readFile(source.path);
    return { data: bytes.toString('base64'), mimeType, name: source.path.split(/[\\/]/).pop() ?? 'image' };
  }

  const url = new URL(source.url!);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new Error('Only http(s) URLs are supported.');
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`Download failed (HTTP ${res.status}).`);
  const mimeType = res.headers.get('content-type')?.split(';')[0].trim() ?? '';
  if (!mimeType.startsWith('image/')) throw new Error(`Not an image (${mimeType || 'unknown type'}).`);
  const bytes = Buffer.from(await res.arrayBuffer());
  if (bytes.length > MAX_BYTES) throw new Error('Image larger than 20 MB.');
  return { data: bytes.toString('base64'), mimeType, name: url.pathname.split('/').pop() || 'image' };
}

/** Where an export lands: a directory (existing, or written with a trailing slash) gets the default name. */
export async function exportPath(target: string | undefined, defaultName: string, cwd = process.cwd()): Promise<string> {
  if (!target) return join(cwd, defaultName);
  const full = resolve(cwd, target);
  if (/[\\/]$/.test(target)) return join(full, defaultName);
  try {
    if ((await stat(full)).isDirectory()) return join(full, defaultName);
  } catch {
    /* doesn't exist yet: a file path */
  }
  return full;
}

export async function writeExport(path: string, base64: string): Promise<number> {
  await mkdir(resolve(path, '..'), { recursive: true });
  const bytes = Buffer.from(base64, 'base64');
  await writeFile(path, bytes);
  return bytes.length;
}
