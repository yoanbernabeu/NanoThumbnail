import { state } from './state.js';
import { t } from './i18n/i18n.js'; // Import t

// DOM Elements
export const views = {
    landing: document.getElementById('landing-view'),
    app: document.getElementById('app-view'),
    modal: document.getElementById('settingsModal'),
    history: document.getElementById('historyPanel')
};

/* --- NAVIGATION --- */
export function showLanding() {
    views.landing.classList.remove('hidden');
    views.app.classList.add('hidden');
    // Hide history button and close history panel on landing
    document.getElementById('historyBtn').classList.add('hidden');
    views.history.classList.remove('open');
}

export function startApp() {
    if (!state.apiKey) {
        openSettings();
    } else {
        views.landing.classList.add('hidden');
        views.app.classList.remove('hidden');
        // Show history button when in app view
        document.getElementById('historyBtn').classList.remove('hidden');
        renderHistory();
    }
}

export function openSettings() {
    document.getElementById('apiKeyInput').value = state.apiKey;
    views.modal.classList.remove('hidden');
}

export function closeSettings() {
    views.modal.classList.add('hidden');
}

export function saveSettings() {
    const key = document.getElementById('apiKeyInput').value.trim();
    
    if (key) {
        state.apiKey = key;
        localStorage.setItem('nano_api_key', key);
        closeSettings();
        // If we were on landing, go to app
        if (!views.landing.classList.contains('hidden')) {
            startApp();
        }
    } else {
        alert(t('alerts.enter_api_key'));
    }
}

export function toggleHistory() {
    views.history.classList.toggle('open');
}

/* --- HISTORY LOGIC --- */
export function loadHistoryImage(url, prompt) {
    // Switch to app view if on landing
    if (!views.app.classList.contains('hidden')) {
        // Already in app view
    } else {
        // Switch from landing to app
        views.landing.classList.add('hidden');
        views.app.classList.remove('hidden');
        document.getElementById('historyBtn').classList.remove('hidden');
    }
    // Close history panel
    views.history.classList.remove('open');
    // Load the image
    displayResult(url, prompt);
}

export function addToHistory(prompt, url) {
    const newItem = { prompt, url, date: new Date().toLocaleTimeString() };
    state.history.unshift(newItem);
    if (state.history.length > 10) state.history.pop();
    localStorage.setItem('nano_history', JSON.stringify(state.history));
    renderHistory();
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function renderHistory() {
    const list = document.getElementById('historyList');
    if (!list) return; 
    
    if (state.history.length === 0) {
        list.innerHTML = `<p style="color: var(--text-muted);">${t('history.empty')}</p>`;
        return;
    }
    
    list.innerHTML = state.history.map((item, index) => {
        const safePrompt = escapeHtml(item.prompt);
        return `
        <div class="history-item">
            <img src="${item.url}" class="history-img" loading="lazy" data-index="${index}" style="cursor:pointer">
            <p class="history-prompt">${safePrompt}</p>
            <small style="color:var(--text-muted)">${item.date}</small>
        </div>
    `;
    }).join('');
    
    const imgs = list.querySelectorAll('.history-img');
    imgs.forEach(img => {
        img.addEventListener('click', () => {
             const index = parseInt(img.getAttribute('data-index'));
             if (index >= 0 && index < state.history.length) {
                 const item = state.history[index];
                 loadHistoryImage(item.url, item.prompt);
             }
        });
    });
}

/* --- IMAGE UPLOAD LOGIC --- */
export function processFile(file) {
    if (!file.type.startsWith('image/')) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        state.currentImageBase64 = e.target.result;
        document.getElementById('previewImage').src = state.currentImageBase64;
        document.getElementById('previewContainer').style.display = 'block';
        document.getElementById('dropZone').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

export function clearImage() {
    state.currentImageBase64 = null;
    document.getElementById('fileInput').value = '';
    document.getElementById('previewContainer').style.display = 'none';
    document.getElementById('dropZone').style.display = 'block';
}

export async function displayResult(url, prompt) {
    const img = document.getElementById('finalImage');
    // Reset display
    img.classList.add('hidden');
    document.getElementById('loader').classList.remove('hidden');
    document.getElementById('placeholder').classList.add('hidden'); 
    
    // Update status text
    document.getElementById('statusText').innerText = t('app.status_loading');
    
    try {
        let finalSrc = url;
        let blobUrl = url;

        if (url.startsWith('http')) {
            const proxyUrl = `${state.proxyUrl}${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Failed to fetch image via proxy');
            const blob = await response.blob();
            blobUrl = URL.createObjectURL(blob);
            finalSrc = blobUrl;
        }

        img.src = finalSrc;
        
        img.onload = () => {
            document.getElementById('loader').classList.add('hidden');
            img.classList.remove('hidden');
            
            const dlLink = document.getElementById('downloadLink');
            dlLink.href = blobUrl;
            dlLink.download = `nano-thumbnail-${Date.now()}.png`; 
            
            document.getElementById('actionsBar').classList.remove('hidden');
            document.getElementById('actionsBar').style.display = 'flex'; 
        };

        img.onerror = () => {
            throw new Error("Image load failed");
        };

    } catch (e) {
        console.error("Image display error:", e);
        document.getElementById('loader').classList.add('hidden');
        
        img.src = url;
        img.classList.remove('hidden');

        alert(t('alerts.error_display'));
        
        const dlLink = document.getElementById('downloadLink');
        dlLink.href = url;
        document.getElementById('actionsBar').classList.remove('hidden');
        document.getElementById('actionsBar').style.display = 'flex'; 
    }
}
