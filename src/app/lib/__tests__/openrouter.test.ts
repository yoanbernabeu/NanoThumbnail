import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateImage, generateText, ProviderError } from '../providers';
import type { GenerationParams } from '../types';

const realFetch = globalThis.fetch;
const PNG = 'data:image/png;base64,iVBORw0KGgo=';
const params: GenerationParams = {
  provider: 'openrouter',
  model: 'nano-banana-pro',
  aspectRatio: '16:9',
  resolution: '2K',
  format: 'png',
  safety: 'block_only_high',
};

type Init = { headers: Record<string, string>; body: string };
let api: ReturnType<typeof vi.fn<(input: string, init: Init) => Promise<Response>>>;

function respond(body: unknown, status = 200) {
  api.mockResolvedValueOnce(new Response(JSON.stringify(body), { status }));
}

beforeEach(() => {
  api = vi.fn<(input: string, init: Init) => Promise<Response>>();
  vi.stubGlobal('location', { origin: 'https://nanothumbnail.test' });
  // Data URLs (image decoding) still go through the real fetch.
  vi.stubGlobal('fetch', (input: string, init: Init) => (input.startsWith('data:') ? realFetch(input) : api(input, init)));
});
afterEach(() => vi.unstubAllGlobals());

describe('OpenRouter provider', () => {
  it('sends prompt, references and image config, and decodes the returned image', async () => {
    respond({ choices: [{ message: { content: '', images: [{ image_url: { url: PNG } }] } }] });

    const blob = await generateImage({ prompt: 'a cat', images: [PNG], params, apiKey: 'sk-or-x' });

    expect(blob.type).toBe('image/png');
    const [url, init] = api.mock.calls[0];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer sk-or-x');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('google/gemini-3-pro-image');
    expect(body.image_config).toEqual({ aspect_ratio: '16:9', image_size: '2K' });
    expect(body.messages[0].content).toEqual([
      { type: 'text', text: 'a cat' },
      { type: 'image_url', image_url: { url: PNG } },
    ]);
  });

  it('fails clearly when no image comes back', async () => {
    respond({ choices: [{ finish_reason: 'content_filter', message: { content: 'nope' } }] });
    await expect(generateImage({ prompt: 'x', images: [], params, apiKey: 'k' })).rejects.toThrow(/content_filter/);
  });

  it('surfaces errors returned inside a 200 response', async () => {
    respond({ error: { message: 'Insufficient credits', code: 402 } });
    const error = await generateImage({ prompt: 'x', images: [], params, apiKey: 'k' }).catch((e) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error.status).toBe(402);
  });

  it('maps HTTP errors to ProviderError', async () => {
    respond({ error: { message: 'No auth credentials found', code: 401 } }, 401);
    const error = await generateText({ provider: 'openrouter', apiKey: 'bad', prompt: 'hi' }).catch((e) => e);
    expect(error).toBeInstanceOf(ProviderError);
    expect(error.status).toBe(401);
    expect(error.message).toBe('No auth credentials found');
  });

  it('passes the system prompt and JSON mode for text', async () => {
    respond({ choices: [{ message: { content: '{"ok":true}' } }] });
    const out = await generateText({ provider: 'openrouter', apiKey: 'k', prompt: 'hi', system: 'be brief', json: true });
    expect(out).toBe('{"ok":true}');
    const body = JSON.parse(api.mock.calls[0][1].body);
    expect(body.messages[0]).toEqual({ role: 'system', content: 'be brief' });
    expect(body.response_format).toEqual({ type: 'json_object' });
  });
});
