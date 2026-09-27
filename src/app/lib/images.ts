/**
 * Client-side image helpers. Everything here runs on <canvas>, no server involved.
 */

/** Reference images are downscaled before upload: keeps requests small (Netlify
 * functions cap bodies at ~6 MB) and follows Replicate's advice to keep inline
 * data URLs around 256 KB. 1536px is plenty for identity/style preservation. */
export const REF_MAX_SIDE = 1536;
export const REF_TARGET_BYTES = 280_000;

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function fetchBlob(url: string, signal?: AbortSignal): Promise<Blob> {
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error(`Image download failed (${res.status})`);
  const blob = await res.blob();
  if (!blob.type.startsWith('image/')) throw new Error(`Unexpected content type: ${blob.type}`);
  return blob;
}

export function decode(blob: Blob): Promise<ImageBitmap> {
  return createImageBitmap(blob);
}

export async function dimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const bmp = await decode(blob);
  const size = { width: bmp.width, height: bmp.height };
  bmp.close();
  return size;
}

function canvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D not available');
  return [c, ctx];
}

function toBlob(c: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed'))), type, quality),
  );
}

/** Downscale + re-encode so the image is a reasonable size to send inline. */
export async function prepareReference(
  blob: Blob,
  maxSide = REF_MAX_SIDE,
  targetBytes = REF_TARGET_BYTES,
): Promise<string> {
  const bmp = await decode(blob);
  const scale = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const [c, ctx] = canvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();

  let quality = 0.9;
  let out = await toBlob(c, 'image/webp', quality);
  while (out.size > targetBytes && quality > 0.5) {
    quality -= 0.1;
    out = await toBlob(c, 'image/webp', quality);
  }
  return blobToDataUrl(out);
}

/** Normalise an uploaded file for local storage (cap at 2048px to keep IndexedDB lean). */
export async function normaliseUpload(file: Blob, maxSide = 2048): Promise<Blob> {
  const bmp = await decode(file);
  if (Math.max(bmp.width, bmp.height) <= maxSide && file.size < 3_000_000) {
    bmp.close();
    return file;
  }
  const scale = maxSide / Math.max(bmp.width, bmp.height);
  const [c, ctx] = canvas(Math.round(bmp.width * scale), Math.round(bmp.height * scale));
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close();
  return toBlob(c, 'image/webp', 0.92);
}

/**
 * YouTube thumbnail spec: 1280×720, JPG/PNG, max 2 MB.
 * Cover-crops to 16:9 and lowers JPEG quality until it fits.
 */
export async function exportForYouTube(blob: Blob, maxBytes = 2_000_000): Promise<Blob> {
  const bmp = await decode(blob);
  const [c, ctx] = canvas(1280, 720);
  const scale = Math.max(1280 / bmp.width, 720 / bmp.height);
  const w = bmp.width * scale;
  const h = bmp.height * scale;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, (1280 - w) / 2, (720 - h) / 2, w, h);
  bmp.close();

  let quality = 0.95;
  let out = await toBlob(c, 'image/jpeg', quality);
  while (out.size > maxBytes && quality > 0.5) {
    quality -= 0.05;
    out = await toBlob(c, 'image/jpeg', quality);
  }
  return out;
}

/**
 * Region edit, step 1: paint the mask onto the image as a translucent magenta
 * overlay so the model can see which area to change.
 */
export async function highlightRegion(image: Blob, mask: HTMLCanvasElement): Promise<Blob> {
  const bmp = await decode(image);
  const [c, ctx] = canvas(bmp.width, bmp.height);
  ctx.drawImage(bmp, 0, 0);
  bmp.close();

  const [tint, tctx] = canvas(c.width, c.height);
  tctx.drawImage(mask, 0, 0, c.width, c.height);
  tctx.globalCompositeOperation = 'source-in';
  tctx.fillStyle = 'rgba(255, 0, 200, 0.55)';
  tctx.fillRect(0, 0, c.width, c.height);

  ctx.drawImage(tint, 0, 0);
  return toBlob(c, 'image/png');
}

/**
 * Region edit, step 2: keep the original pixels everywhere outside the mask,
 * so the model can't silently drift the rest of the thumbnail.
 */
export async function mergeWithMask(
  original: Blob,
  edited: Blob,
  mask: HTMLCanvasElement,
  feather = 12,
): Promise<Blob> {
  const [orig, edit] = await Promise.all([decode(original), decode(edited)]);
  const [c, ctx] = canvas(orig.width, orig.height);
  ctx.drawImage(orig, 0, 0);

  // Edited layer, clipped by a feathered mask
  const [layer, lctx] = canvas(c.width, c.height);
  lctx.drawImage(edit, 0, 0, c.width, c.height);
  lctx.globalCompositeOperation = 'destination-in';
  lctx.filter = `blur(${feather}px)`;
  lctx.drawImage(mask, 0, 0, c.width, c.height);
  lctx.filter = 'none';

  ctx.drawImage(layer, 0, 0);
  orig.close();
  edit.close();
  return toBlob(c, 'image/png');
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function extensionFor(blob: Blob): string {
  if (blob.type === 'image/jpeg') return 'jpg';
  if (blob.type === 'image/webp') return 'webp';
  return 'png';
}

/** A mask covering one rectangle, given as fractions of the image (region edits from the agent). */
export function rectMask(
  width: number,
  height: number,
  region: { x: number; y: number; width: number; height: number },
): HTMLCanvasElement {
  const [c, ctx] = canvas(width, height);
  ctx.fillStyle = 'rgb(255 0 200)';
  ctx.fillRect(region.x * width, region.y * height, region.width * width, region.height * height);
  return c;
}

/** Raw base64 (no data: prefix) and its MIME type. */
export async function blobToBase64(blob: Blob): Promise<{ data: string; mimeType: string }> {
  const url = await blobToDataUrl(blob);
  const comma = url.indexOf(',');
  return { data: url.slice(comma + 1), mimeType: url.slice(5, url.indexOf(';')) || blob.type };
}
