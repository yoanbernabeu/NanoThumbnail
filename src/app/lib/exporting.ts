import { zipFiles } from './backup';
import { downloadBlob, exportForYouTube } from './images';
import type { Generation } from './types';

function slug(text: string): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'thumbnail'
  );
}

export async function downloadForYouTube(gen: Generation): Promise<void> {
  const blob = await exportForYouTube(gen.blob);
  downloadBlob(blob, `${slug(gen.videoTitle || gen.prompt)}-1280x720.jpg`);
}

/** Up to 3 variants in YouTube spec, zipped as A/B/C for Studio's "Test & Compare". */
export async function exportTestCompare(gens: Generation[]): Promise<void> {
  const picked = gens.slice(0, 3);
  const letters = ['A', 'B', 'C'];
  const entries = await Promise.all(
    picked.map(async (g, i) => ({ name: `${letters[i]}-${slug(g.videoTitle || g.prompt)}.jpg`, blob: await exportForYouTube(g.blob) })),
  );
  const zip = await zipFiles(entries);
  downloadBlob(zip, `test-compare-${slug(picked[0]?.videoTitle || 'thumbnails')}.zip`);
}
