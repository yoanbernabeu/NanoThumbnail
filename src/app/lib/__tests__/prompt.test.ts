import { describe, expect, it } from 'vitest';
import { buildEditPrompt, buildGenerationPrompt, buildRegionEditPrompt, describeImages, quote } from '../prompt';

const base = { brief: 'A developer on Mars', overlayText: '', textMode: 'render' as const, aspectRatio: '16:9' as const, roles: [] };

describe('buildGenerationPrompt', () => {
  it('states the format and the scene', () => {
    const p = buildGenerationPrompt(base);
    expect(p).toMatch(/^Generate a 16:9 YouTube video thumbnail\./);
    expect(p).toContain('Scene: A developer on Mars');
  });

  it('asks for a purely visual image when there is no text', () => {
    expect(buildGenerationPrompt(base)).toContain('purely visual thumbnail');
  });

  it('renders the exact text, accents included', () => {
    const p = buildGenerationPrompt({ ...base, overlayText: 'Ça marche !' });
    expect(p).toContain('render the exact text "Ça marche !"');
  });

  it('reserves space instead of rendering text in space mode', () => {
    const p = buildGenerationPrompt({ ...base, overlayText: 'Hello', textMode: 'space' });
    expect(p).toContain('negative space');
    expect(p).not.toContain('"Hello"');
  });

  it('adds the video title as context without asking to repeat it', () => {
    const p = buildGenerationPrompt({ ...base, videoTitle: 'I coded on Mars' });
    expect(p).toContain('"I coded on Mars"');
    expect(p).toContain('rather than repeat it');
  });

  it('includes style and brand only when provided/enabled', () => {
    const brand = { enabled: false, channelName: '', colors: ['#ff0000'], fontStyle: '', notes: '', styleProfile: 'Bold yellow' };
    expect(buildGenerationPrompt({ ...base, brand })).not.toContain('Bold yellow');
    const p = buildGenerationPrompt({ ...base, style: 'Clay render', brand: { ...brand, enabled: true } });
    expect(p).toContain('Art direction: Clay render');
    expect(p).toContain('Channel visual identity: Bold yellow');
    expect(p).toContain('#ff0000');
  });
});

describe('describeImages', () => {
  it('groups consecutive photos of the same person', () => {
    const lines = describeImages([
      { kind: 'persona', name: 'Alex' },
      { kind: 'persona', name: 'Alex', expression: 'surprised' },
      { kind: 'persona', name: 'Sam' },
      { kind: 'style' },
    ]);
    expect(lines[0]).toMatch(/^- Images 1–2: photos of Alex\./);
    expect(lines[0]).toContain('surprised');
    expect(lines[1]).toMatch(/^- Image 3: photos of Sam\./);
    expect(lines[2]).toMatch(/^- Image 4: .*art style only/);
  });

  it('supports an index offset', () => {
    expect(describeImages([{ kind: 'logo' }], 1)[0]).toMatch(/^- Image 2:/);
  });
});

describe('edit prompts', () => {
  it('uses the "change only / keep everything else" pattern', () => {
    const p = buildEditPrompt('Make the face more surprised');
    expect(p).toContain('Using image 1 (the current thumbnail), make the face more surprised');
    expect(p).toContain('Keep everything else in the image exactly the same');
  });

  it('describes extra images starting at index 2', () => {
    expect(buildEditPrompt('x', [{ kind: 'persona', name: 'Alex' }])).toContain('- Image 2: photos of Alex');
  });

  it('region edits edit the clean image and use the marked copy only as a guide', () => {
    const p = buildRegionEditPrompt('add a hat');
    expect(p).toContain('Edit image 1');
    expect(p).toContain('Image 2 is the same thumbnail with a translucent magenta overlay');
    expect(p).toContain('within the area marked in image 2: add a hat');
  });
});

describe('quote', () => {
  it('neutralises inner double quotes', () => {
    expect(quote('Say "hi"')).toBe('"Say \'hi\'"');
  });
});
