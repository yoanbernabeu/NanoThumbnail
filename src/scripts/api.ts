import { state } from './state';
import { displayResult, addToHistory } from './ui';
import { t } from './i18n/index';
import { showErrorModal } from './modules/errors/handler';

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

export async function generateImage(): Promise<void> {
  const promptInput = document.getElementById('promptInput') as HTMLTextAreaElement | null;
  const prompt = promptInput?.value.trim() || '';
  
  if (!prompt) {
    alert(t('alerts.enter_prompt'));
    return;
  }
  
  // UI Updates
  const generateBtn = document.getElementById('generateBtn') as HTMLButtonElement | null;
  const placeholder = document.getElementById('placeholder');
  const finalImage = document.getElementById('finalImage');
  const actionsBar = document.getElementById('actionsBar');
  const loader = document.getElementById('loader');
  const statusText = document.getElementById('statusText');
  
  if (generateBtn) generateBtn.disabled = true;
  if (placeholder) placeholder.classList.add('hidden');
  if (finalImage) finalImage.classList.add('hidden');
  if (actionsBar) actionsBar.classList.add('hidden');
  if (loader) loader.classList.remove('hidden');
  
  // Get params
  const resolutionSelect = document.getElementById('resolutionSelect') as HTMLSelectElement | null;
  const aspectRatioSelect = document.getElementById('aspectRatioSelect') as HTMLSelectElement | null;
  const formatSelect = document.getElementById('formatSelect') as HTMLSelectElement | null;
  const safetySelect = document.getElementById('safetySelect') as HTMLSelectElement | null;
  
  const resolution = resolutionSelect?.value || '2K';
  const aspectRatio = aspectRatioSelect?.value || '16:9';
  const format = formatSelect?.value || 'png';
  const safety = safetySelect?.value || 'block_only_high';

  const enhancedPrompt = `YouTube thumbnail, catchy, high contrast, vibrant colors, 4k, highly detailed, ${prompt}, cinematic lighting, expressive, viral style`;

  const inputData: PredictionInput = {
    prompt: enhancedPrompt,
    resolution: resolution,
    aspect_ratio: aspectRatio,
    output_format: format,
    safety_filter_level: safety,
    image_input: state.referenceImages
  };

  try {
    const createUrl = `${state.proxyUrl}https://api.replicate.com/v1/models/google/nano-banana-pro/predictions`;
    
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${state.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: inputData
      })
    });

    // Handle HTTP Errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails: Record<string, unknown>;
      
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { rawResponse: errorText };
      }
      
      // Configure the modal options
      const modalOptions = {
        statusCode: response.status,
        errorDetails: errorDetails
      };

      // Trigger the global modal display
      showErrorModal(modalOptions);
      
      throw new Error(`${t('alerts.error_api')} (${response.status}): ${errorText}`);
    }
    
    let prediction: PredictionResponse = await response.json();
    const predictionGetUrl = prediction.urls.get;
    const startTime = Date.now();

    // -----------------------------------------
    // POLLING LOOP
    // -----------------------------------------
    while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      if (statusText) {
        statusText.innerText = `${t('app.status_working')} (${elapsed}s)\nStatut: ${prediction.status}`;
      }
      
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
      showErrorModal({
        statusCode: 500,
        errorDetails: prediction as unknown as Record<string, unknown>
      });
      throw new Error(`${t('alerts.error_generation')}: ${prediction.status}`);
    }

    // Success
    if (statusText) statusText.innerText = t('app.status_download');
    const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    
    if (imageUrl) {
      console.log('Image URL:', imageUrl);
      const base64Data = await displayResult(imageUrl, prompt);
      await addToHistory(prompt, imageUrl, base64Data);
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
