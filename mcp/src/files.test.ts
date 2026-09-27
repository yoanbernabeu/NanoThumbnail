import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { exportPath, loadImage, writeExport } from './files.ts';

describe('exportPath', () => {
  it('defaults to the working directory', async () => {
    expect(await exportPath(undefined, 'a.jpg', '/work')).toBe('/work/a.jpg');
  });
  it('uses the default name inside a directory', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'nt-'));
    expect(await exportPath(dir, 'a.jpg')).toBe(join(dir, 'a.jpg'));
    expect(await exportPath('out/', 'a.jpg', '/work')).toBe('/work/out/a.jpg');
  });
  it('keeps an explicit file name', async () => {
    expect(await exportPath('thumbs/final.jpg', 'a.jpg', '/work')).toBe('/work/thumbs/final.jpg');
  });
});

describe('files', () => {
  it('round-trips an image through base64', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'nt-'));
    const src = join(dir, 'ref.png');
    await writeFile(src, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const image = await loadImage({ path: src });
    expect(image.mimeType).toBe('image/png');
    const out = join(dir, 'nested', 'copy.png');
    await writeExport(out, image.data);
    expect([...(await readFile(out))]).toEqual([0x89, 0x50, 0x4e, 0x47]);
  });
  it('rejects relative paths, unknown types and ambiguous sources', async () => {
    await expect(loadImage({ path: 'ref.png' })).rejects.toThrow(/absolute/);
    await expect(loadImage({ path: '/tmp/notes.txt' })).rejects.toThrow(/Unsupported/);
    await expect(loadImage({})).rejects.toThrow(/exactly one/);
    await expect(loadImage({ url: 'file:///etc/passwd' })).rejects.toThrow(/http/);
  });
});
