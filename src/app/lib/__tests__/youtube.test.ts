import { describe, expect, it } from 'vitest';
import { extractVideoId } from '../youtube';

describe('extractVideoId', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?list=x&v=dQw4w9WgXcQ&t=10', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ?si=abc', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/live/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['  dQw4w9WgXcQ ', 'dQw4w9WgXcQ'],
  ])('%s', (url, id) => {
    expect(extractVideoId(url)).toBe(id);
  });

  it('rejects other URLs', () => {
    expect(extractVideoId('https://example.com/watch?v=nope')).toBeNull();
    expect(extractVideoId('')).toBeNull();
  });
});
