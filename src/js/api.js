import { state } from './state.js';
import { displayResult, addToHistory } from './ui.js';
import { t } from './i18n/i18n.js';

export async function generateImage() {
    const prompt = document.getElementById('promptInput').value.trim();
    if (!prompt) return alert(t('alerts.enter_prompt'));
    
    // UI Updates
    document.getElementById('generateBtn').disabled = true;
    document.getElementById('placeholder').classList.add('hidden');
    document.getElementById('finalImage').classList.add('hidden');
    document.getElementById('actionsBar').classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');
    
    // Get params
    const resolution = document.getElementById('resolutionSelect').value; 
    const aspectRatio = document.getElementById('aspectRatioSelect').value; 
    const format = document.getElementById('formatSelect').value;
    const safety = document.getElementById('safetySelect').value;

    const enhancedPrompt = `YouTube thumbnail, catchy, high contrast, vibrant colors, 4k, highly detailed, ${prompt}, cinematic lighting, expressive, viral style`;

    const inputData = {
        prompt: enhancedPrompt,
        resolution: resolution,
        aspect_ratio: aspectRatio,
        output_format: format,
        safety_filter_level: safety,
        image_input: [] 
    };

    if (state.currentImageBase64) {
        inputData.image_input = [state.currentImageBase64];
    }

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

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`${t('alerts.error_api')} (${response.status}): ${err}`);
        }
        
        let prediction = await response.json();
        const predictionGetUrl = prediction.urls.get;
        const startTime = Date.now();

        // -----------------------------------------
        // POLLING LOOP
        // -----------------------------------------
        while (prediction.status !== 'succeeded' && prediction.status !== 'failed' && prediction.status !== 'canceled') {
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            document.getElementById('statusText').innerText = `${t('app.status_working')} (${elapsed}s)\nStatut: ${prediction.status}`;
            
            await new Promise(r => setTimeout(r, 1000));
            
            const separator = predictionGetUrl.includes('?') ? '&' : '?';
            const urlWithCacheBuster = `${predictionGetUrl}${separator}t=${Date.now()}`;
            const finalUrl = `${state.proxyUrl}${encodeURIComponent(urlWithCacheBuster)}`;
            
            const pollResponse = await fetch(finalUrl, {
                headers: { 'Authorization': `Token ${state.apiKey}` }
            });
            
            if (pollResponse.ok) {
                prediction = await pollResponse.json();
                if (prediction.logs) console.log(prediction.logs); 
            }
        }

        if (prediction.status !== 'succeeded') throw new Error(`${t('alerts.error_generation')}: ${prediction.status}`);

        // Success
        document.getElementById('statusText').innerText = t('app.status_download');
        const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
        console.log('Image URL:', imageUrl);
        
        await displayResult(imageUrl, prompt);
        addToHistory(prompt, imageUrl);

    } catch (error) {
        console.error(error);
        alert("Error: " + error.message);
        document.getElementById('loader').classList.add('hidden');
        document.getElementById('placeholder').classList.remove('hidden');
    } finally {
        document.getElementById('generateBtn').disabled = false;
    }
}
