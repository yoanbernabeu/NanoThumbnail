import { state } from './state';
import { t } from './i18n/index';
import { showErrorModal } from './modules/errors/handler';

interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: GeminiPart[];
    };
  }>;
  error?: { message: string; code: number };
}

const ASPECT_RATIO_MAP: Record<string, string> = {
  '16:9': '16:9',
  '9:16': '9:16',
  '1:1': '1:1',
  '4:3': '4:3',
  'match_input_image': '16:9', // Fallback — Gemini doesn't support match_input_image
};

export async function generateViaGemini(params: {
  prompt: string;
  aspectRatio: string;
  referenceImages: string[];
}): Promise<string> {
  const { prompt, aspectRatio, referenceImages } = params;

  // Build parts array
  const parts: GeminiPart[] = [{ text: prompt }];

  for (const img of referenceImages) {
    // img is a data URI like "data:image/png;base64,..."
    const match = img.match(/^data:(image\/\w+);base64,(.+)$/);
    if (match) {
      parts.push({
        inlineData: {
          mimeType: match[1],
          data: match[2],
        },
      });
    }
  }

  const body = {
    contents: [{ parts }],
    generationConfig: {
      responseModalities: ['IMAGE', 'TEXT'],
      imageConfig: {
        aspectRatio: ASPECT_RATIO_MAP[aspectRatio] || '16:9',
      },
    },
  };

  // Call Gemini API directly (no proxy) — Google's API supports CORS,
  // and the proxy causes Inactivity Timeout on long image generations.
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${encodeURIComponent(state.apiKey)}`;

  const response = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails: Record<string, unknown>;
    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = { rawResponse: errorText };
    }
    showErrorModal({ statusCode: response.status, errorDetails });
    throw new Error(`${t('alerts.error_api')} (${response.status}): ${errorText}`);
  }

  const data: GeminiResponse = await response.json();

  if (data.error) {
    showErrorModal({
      statusCode: data.error.code,
      errorDetails: data.error as unknown as Record<string, unknown>,
    });
    throw new Error(`${t('alerts.error_api')}: ${data.error.message}`);
  }

  // Extract inlineData from the first candidate
  const candidate = data.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((p) => p.inlineData);

  if (!imagePart?.inlineData) {
    showErrorModal({
      statusCode: 500,
      errorDetails: { message: 'No image returned by Gemini', response: data as unknown as Record<string, unknown> },
    });
    throw new Error(t('alerts.error_generation'));
  }

  const { mimeType, data: b64 } = imagePart.inlineData;
  return `data:${mimeType};base64,${b64}`;
}
