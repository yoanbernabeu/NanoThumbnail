import { state, type GenerationParameters } from './state';
import { displayResult, addToHistory, showGrid, updateGridCell, failGridCell, selectGridCell } from './ui';
import { t } from './i18n/index';
import { showErrorModal } from './modules/errors/handler';
import { generateViaGemini } from './gemini';

interface PredictionInput {
  prompt: string;
  resolution: string;
  aspect_ratio: string;
  output_format: string;
  safety_filter_level: string;
  image_input: string[];
}

interface PredictionResponse {
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  urls: {
    get: string;
  };
  output?: string | string[];
  logs?: string;
}

// Map model ID to Replicate endpoint
const REPLICATE_MODEL_MAP: Record<string, string> = {
  'nano-banana-pro': 'google/nano-banana-pro',
  'nano-banana-2': 'google/nano-banana-2',
};

/**
 * Get the current generation count (1 or 4)
 */
function getGenerationCount(): number {
  const activeBtn = document.querySelector('.count-btn.active') as HTMLElement | null;
  return parseInt(activeBtn?.getAttribute('data-count') || '1');
}

/**
 * Collect common generation params from the UI
 */
function collectParams() {
  const promptInput = document.getElementById('promptInput') as HTMLTextAreaElement | null;
  const prompt = promptInput?.value.trim() || '';

  const modelSelect = document.getElementById('modelSelect') as HTMLSelectElement | null;
  const resolutionSelect = document.getElementById('resolutionSelect') as HTMLSelectElement | null;
  const aspectRatioSelect = document.getElementById('aspectRatioSelect') as HTMLSelectElement | null;
  const formatSelect = document.getElementById('formatSelect') as HTMLSelectElement | null;
  const safetySelect = document.getElementById('safetySelect') as HTMLSelectElement | null;
  const titleInput = document.getElementById('titleInput') as HTMLInputElement | null;

  const model = modelSelect?.value || state.model;
  const resolution = resolutionSelect?.value || '2K';
  const aspectRatio = aspectRatioSelect?.value || '16:9';
  const format = formatSelect?.value || 'png';
  const safety = safetySelect?.value || 'block_only_high';
  const title = titleInput?.value.trim() || '';

  const titlePart = title ? `, bold text overlay saying '${title}'` : '';
  const enhancedPrompt = `YouTube thumbnail, catchy, high contrast, vibrant colors, 4k, highly detailed, ${prompt}${titlePart}, cinematic lighting, expressive, viral style`;

  return { prompt, model, resolution, aspectRatio, format, safety, enhancedPrompt };
}

/**
 * Execute a single generation via Gemini and return the data URI
 */
async function executeSingleGemini(enhancedPrompt: string, aspectRatio: string, model: string): Promise<string> {
  return generateViaGemini({
    prompt: enhancedPrompt,
    aspectRatio,
    model,
    referenceImages: state.referenceImages,
  });
}

/**
 * Execute a single generation via Replicate and return { imageUrl, base64Data }
 */
async function executeSingleReplicate(
  inputData: PredictionInput,
  model: string,
  onStatus?: (text: string) => void
): Promise<{ imageUrl: string; base64Data?: string }> {
  const replicateModel = REPLICATE_MODEL_MAP[model] || 'google/nano-banana-pro';
  const createUrl = `${state.proxyUrl}${encodeURIComponent(`https://api.replicate.com/v1/models/${replicateModel}/predictions`)}`;

  const response = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Token ${state.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ input: inputData })
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
    throw new Error(`${t('alerts.error_api')} (${response.status})`);
  }

  let prediction: PredictionResponse = await response.json();
  const predictionGetUrl = prediction.urls.get;
  const startTime = Date.now();

  while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    onStatus?.(`${t('app.status_working')} (${elapsed}s)`);

    await new Promise(r => setTimeout(r, 1000));

    const separator = predictionGetUrl.includes('?') ? '&' : '?';
    const urlWithCacheBuster = `${predictionGetUrl}${separator}t=${Date.now()}`;
    const finalUrl = `${state.proxyUrl}${encodeURIComponent(urlWithCacheBuster)}`;

    const pollResponse = await fetch(finalUrl, {
      headers: { 'Authorization': `Token ${state.apiKey}` }
    });

    if (pollResponse.ok) {
      prediction = await pollResponse.json();
      if (prediction.logs) console.log('Generation Logs:', prediction.logs);
    }
  }

  if (prediction.status !== 'succeeded') {
    throw new Error(`${t('alerts.error_generation')}: ${prediction.status}`);
  }

  const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
  if (!imageUrl) throw new Error('No image URL in response');

  return { imageUrl };
}

/**
 * Main entry point for image generation (single or multi)
 */
export async function generateImage(): Promise<void> {
  const { prompt, model, resolution, aspectRatio, format, safety, enhancedPrompt } = collectParams();

  if (!prompt) {
    alert(t('alerts.enter_prompt'));
    return;
  }

  const count = getGenerationCount();
  const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement | null;
  const placeholder = document.getElementById('placeholder');
  const finalImage = document.getElementById('finalImage');
  const actionsBar = document.getElementById('actionsBar');
  const loader = document.getElementById('loader');
  const statusText = document.getElementById('statusText');
  const gridResult = document.getElementById('gridResult');

  if (generateBtn) generateBtn.disabled = true;
  if (placeholder) placeholder.classList.add('hidden');
  if (actionsBar) actionsBar.classList.add('hidden');

  const inputData: PredictionInput = {
    prompt: enhancedPrompt,
    resolution,
    aspect_ratio: aspectRatio,
    output_format: format,
    safety_filter_level: safety,
    image_input: state.referenceImages
  };

  const parameters: GenerationParameters = {
    resolution,
    aspect_ratio: aspectRatio,
    output_format: state.provider === 'gemini' ? 'png' : format,
    safety_filter_level: safety,
    provider: state.provider,
    model: model as GenerationParameters['model'],
  };

  try {
    if (count === 1) {
      // ── Single mode ─────────────────────────
      if (finalImage) finalImage.classList.add('hidden');
      if (gridResult) gridResult.classList.add('hidden');
      if (loader) loader.classList.remove('hidden');
      if (statusText) statusText.innerText = t('app.status_working');

      if (state.provider === 'gemini') {
        const dataUri = await executeSingleGemini(enhancedPrompt, aspectRatio, model);
        if (statusText) statusText.innerText = t('app.status_download');
        await displayResult(dataUri, prompt);
        await addToHistory(prompt, dataUri, dataUri, parameters);
      } else {
        const result = await executeSingleReplicate(inputData, model, (text) => {
          if (statusText) statusText.innerText = text;
        });
        if (statusText) statusText.innerText = t('app.status_download');
        const base64Data = await displayResult(result.imageUrl, prompt);
        await addToHistory(prompt, result.imageUrl, base64Data, parameters);
      }

    } else {
      // ── Multi mode (4 images) ───────────────
      if (finalImage) finalImage.classList.add('hidden');
      if (loader) loader.classList.add('hidden');
      showGrid();

      let firstDone = false;

      const promises = Array.from({ length: count }, (_, i) => {
        const run = async () => {
          try {
            let imageUrl: string;
            let base64Data: string | undefined;

            if (state.provider === 'gemini') {
              const dataUri = await executeSingleGemini(enhancedPrompt, aspectRatio, model);
              imageUrl = dataUri;
              base64Data = dataUri;
            } else {
              const result = await executeSingleReplicate(inputData, model);
              imageUrl = result.imageUrl;

              // Fetch image and convert to base64
              const resp = await fetch(imageUrl);
              const blob = await resp.blob();
              const reader = new FileReader();
              base64Data = await new Promise<string>((resolve) => {
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
              });
              // Use blob URL for display
              imageUrl = URL.createObjectURL(blob);
            }

            updateGridCell(i, imageUrl);

            // Auto-select first completed
            if (!firstDone) {
              firstDone = true;
              selectGridCell(i);
            }

            // Save to history
            await addToHistory(prompt, imageUrl, base64Data, parameters);
          } catch (error) {
            console.error(`Generation ${i + 1} failed:`, error);
            failGridCell(i);
          }
        };
        return run();
      });

      await Promise.allSettled(promises);
    }

  } catch (error) {
    console.error('Workflow Error:', error);
    if (loader) loader.classList.add('hidden');
    if (placeholder) placeholder.classList.remove('hidden');
  } finally {
    if (generateBtn) generateBtn.disabled = false;
  }
}

export function initGenerateButton(): void {
  const generateBtn = document.getElementById('generateBtn');
  if (generateBtn) {
    generateBtn.addEventListener('click', generateImage);
  }
}
