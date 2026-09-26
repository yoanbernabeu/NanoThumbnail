import type { GenerationParams, ModelId, Provider } from './types';
import { dataUrlToBlob, fetchBlob } from './images';

/**
 * Provider layer. Replicate has no browser CORS support, so its calls go through
 * our own Netlify function; Gemini supports CORS and is called directly.
 */

export const PROXY_URL = '/.netlify/functions/replicate-proxy?url=';

const REPLICATE_IMAGE_MODELS: Record<ModelId, string> = {
  'nano-banana-pro': 'google/nano-banana-pro',
  'nano-banana-2': 'google/nano-banana-2',
};
const REPLICATE_TEXT_MODEL = 'google/gemini-3-flash';

const GEMINI_IMAGE_MODELS: Record<ModelId, string> = {
  'nano-banana-pro': 'gemini-3-pro-image',
  'nano-banana-2': 'gemini-3.1-flash-image',
};
const GEMINI_TEXT_MODEL = 'gemini-3.6-flash';
const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Hard ceiling for one generation. Nano Banana Pro at 4K can take a couple of minutes. */
const GENERATION_TIMEOUT_MS = 5 * 60_000;

export class ProviderError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: unknown,
    public provider: Provider,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export interface ImageRequest {
  prompt: string;
  /** Data URLs, already downscaled. */
  images: string[];
  params: GenerationParams;
  apiKey: string;
  signal?: AbortSignal;
  onProgress?: (elapsedMs: number) => void;
}

export interface TextRequest {
  provider: Provider;
  apiKey: string;
  prompt: string;
  system?: string;
  images?: string[];
  json?: boolean;
  signal?: AbortSignal;
}

// ─── Shared helpers ──────────────────────────────────────

function withTimeout(signal: AbortSignal | undefined, ms: number): AbortSignal {
  const timeout = AbortSignal.timeout(ms);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function readError(res: Response, provider: Provider): Promise<ProviderError> {
  const text = await res.text();
  let details: unknown;
  try {
    details = JSON.parse(text);
  } catch {
    details = { raw: text };
  }
  const d = details as { detail?: string; error?: { message?: string } | string; title?: string };
  const message =
    (typeof d.error === 'object' ? d.error?.message : d.error) || d.detail || d.title || `HTTP ${res.status}`;
  return new ProviderError(message, res.status, details, provider);
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      },
      { once: true },
    );
  });
}

// ─── Replicate ───────────────────────────────────────────

interface Prediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[] | null;
  error?: string | null;
  urls: { get: string; cancel: string };
}

function proxied(url: string): string {
  return `${PROXY_URL}${encodeURIComponent(url)}`;
}

async function replicateRun(
  model: string,
  input: Record<string, unknown>,
  apiKey: string,
  signal: AbortSignal,
  onProgress?: (elapsedMs: number) => void,
): Promise<Prediction> {
  const started = Date.now();
  const headers = { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };

  // `Prefer: wait` makes Replicate hold the request until the prediction ends.
  // Kept below the Netlify function limit (10 s); we poll past that.
  const res = await fetch(proxied(`https://api.replicate.com/v1/models/${model}/predictions`), {
    method: 'POST',
    headers: { ...headers, Prefer: 'wait=8' },
    body: JSON.stringify({ input }),
    signal,
  });
  if (!res.ok) throw await readError(res, 'replicate');

  let prediction: Prediction = await res.json();
  let delay = 1000;

  try {
    while (prediction.status === 'starting' || prediction.status === 'processing') {
      onProgress?.(Date.now() - started);
      await sleep(delay, signal);
      delay = Math.min(delay * 1.4, 3000);
      const poll = await fetch(proxied(prediction.urls.get), { headers, signal, cache: 'no-store' });
      if (poll.ok) prediction = await poll.json();
      else if (poll.status !== 429 && poll.status < 500) throw await readError(poll, 'replicate');
    }
  } catch (error) {
    // Stop paying for a prediction nobody is waiting for anymore.
    if (signal.aborted && prediction.urls?.cancel) {
      fetch(proxied(prediction.urls.cancel), { method: 'POST', headers }).catch(() => {});
    }
    throw error;
  }

  if (prediction.status !== 'succeeded') {
    throw new ProviderError(prediction.error || `Prediction ${prediction.status}`, 500, prediction, 'replicate');
  }
  return prediction;
}

async function replicateImage(req: ImageRequest, signal: AbortSignal): Promise<Blob> {
  const { params } = req;
  const input: Record<string, unknown> = {
    prompt: req.prompt,
    image_input: req.images,
    aspect_ratio: params.aspectRatio,
    resolution: params.resolution,
    output_format: params.format,
  };
  // Only Nano Banana Pro exposes a safety level.
  if (params.model === 'nano-banana-pro') input.safety_filter_level = params.safety;

  const prediction = await replicateRun(REPLICATE_IMAGE_MODELS[params.model], input, req.apiKey, signal, req.onProgress);
  const url = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!url) throw new ProviderError('No image in response', 500, prediction, 'replicate');
  return fetchBlob(url, signal);
}

async function replicateText(req: TextRequest, signal: AbortSignal): Promise<string> {
  const input: Record<string, unknown> = {
    prompt: req.prompt,
    images: req.images ?? [],
    thinking_level: 'low',
    max_output_tokens: 4096,
    temperature: 0.7,
  };
  if (req.system) input.system_instruction = req.system;
  const prediction = await replicateRun(REPLICATE_TEXT_MODEL, input, req.apiKey, signal);
  const out = prediction.output;
  return Array.isArray(out) ? out.join('') : (out ?? '');
}

// ─── Gemini ──────────────────────────────────────────────

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}
interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] }; finishReason?: string }>;
  promptFeedback?: { blockReason?: string };
}

function toInlinePart(dataUrl: string): GeminiPart | null {
  const m = dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  return m ? { inlineData: { mimeType: m[1], data: m[2] } } : null;
}

async function geminiCall(model: string, body: unknown, apiKey: string, signal: AbortSignal): Promise<GeminiResponse> {
  // Key goes in a header, never in the URL (URLs end up in logs and history).
  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw await readError(res, 'gemini');
  return res.json();
}

async function geminiImage(req: ImageRequest, signal: AbortSignal): Promise<Blob> {
  const started = Date.now();
  const tick = req.onProgress ? setInterval(() => req.onProgress?.(Date.now() - started), 500) : undefined;
  try {
    const parts: GeminiPart[] = [{ text: req.prompt }, ...req.images.map(toInlinePart).filter((p): p is GeminiPart => !!p)];
    const data = await geminiCall(
      GEMINI_IMAGE_MODELS[req.params.model],
      {
        contents: [{ role: 'user', parts }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: req.params.aspectRatio, imageSize: req.params.resolution },
        },
      },
      req.apiKey,
      signal,
    );
    const candidate = data.candidates?.[0];
    const image = candidate?.content?.parts?.find((p) => p.inlineData)?.inlineData;
    if (!image) {
      const reason = data.promptFeedback?.blockReason || candidate?.finishReason || 'NO_IMAGE';
      throw new ProviderError(`Gemini returned no image (${reason})`, 422, data, 'gemini');
    }
    return dataUrlToBlob(`data:${image.mimeType};base64,${image.data}`);
  } finally {
    clearInterval(tick);
  }
}

async function geminiText(req: TextRequest, signal: AbortSignal): Promise<string> {
  const parts: GeminiPart[] = [
    { text: req.prompt },
    ...(req.images ?? []).map(toInlinePart).filter((p): p is GeminiPart => !!p),
  ];
  const data = await geminiCall(
    GEMINI_TEXT_MODEL,
    {
      contents: [{ role: 'user', parts }],
      ...(req.system ? { systemInstruction: { parts: [{ text: req.system }] } } : {}),
      generationConfig: {
        temperature: 0.7,
        ...(req.json ? { responseMimeType: 'application/json' } : {}),
      },
    },
    req.apiKey,
    signal,
  );
  return data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
}

// ─── Public API ──────────────────────────────────────────

export async function generateImage(req: ImageRequest): Promise<Blob> {
  const signal = withTimeout(req.signal, GENERATION_TIMEOUT_MS);
  return req.params.provider === 'gemini' ? geminiImage(req, signal) : replicateImage(req, signal);
}

export async function generateText(req: TextRequest): Promise<string> {
  const signal = withTimeout(req.signal, 90_000);
  return req.provider === 'gemini' ? geminiText(req, signal) : replicateText(req, signal);
}

/** Ask for JSON and parse it, tolerating ```json fences some models add. */
export async function generateJSON<T>(req: Omit<TextRequest, 'json'>): Promise<T> {
  const raw = await generateText({ ...req, json: true });
  const cleaned = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  const start = cleaned.search(/[[{]/);
  if (start < 0) throw new ProviderError('Model did not return JSON', 500, { raw }, req.provider);
  return JSON.parse(cleaned.slice(start)) as T;
}
