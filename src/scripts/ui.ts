import { state, type HistoryItem } from './state';
import { t } from './i18n/index';

// DOM Elements cache
let historyPanel: HTMLElement | null = null;
let settingsModal: HTMLElement | null = null;

/* --- NAVIGATION --- */
export function openSettings(): void {
  const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement | null;
  settingsModal = document.getElementById('settingsModal');
  
  if (apiKeyInput) {
    apiKeyInput.value = state.apiKey;
  }
  if (settingsModal) {
    settingsModal.classList.remove('hidden');
  }
}

export function closeSettings(): void {
  settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.classList.add('hidden');
  }
}

export function saveSettings(): void {
  const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement | null;
  const key = apiKeyInput?.value.trim() || '';
  
  if (key) {
    state.apiKey = key;
    localStorage.setItem('nano_api_key', key);
    closeSettings();
  } else {
    alert(t('alerts.enter_api_key'));
  }
}

export function toggleHistory(): void {
  historyPanel = document.getElementById('historyPanel');
  if (historyPanel) {
    historyPanel.classList.toggle('open');
  }
}

/* --- HISTORY LOGIC --- */
export function loadHistoryImage(url: string, prompt: string): void {
  // Close history panel
  historyPanel = document.getElementById('historyPanel');
  if (historyPanel) {
    historyPanel.classList.remove('open');
  }
  // Load the image
  displayResult(url, prompt);
}

export function addToHistory(prompt: string, url: string): void {
  const newItem: HistoryItem = { prompt, url, date: new Date().toLocaleTimeString() };
  state.history.unshift(newItem);
  if (state.history.length > 10) state.history.pop();
  localStorage.setItem('nano_history', JSON.stringify(state.history));
  renderHistory();
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function renderHistory(): void {
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
      const index = parseInt(img.getAttribute('data-index') || '0');
      if (index >= 0 && index < state.history.length) {
        const item = state.history[index];
        loadHistoryImage(item.url, item.prompt);
      }
    });
  });
}

/* --- IMAGE UPLOAD LOGIC --- */
export function processFile(file: File): void {
  if (!file.type.startsWith('image/')) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    // Check limit at the moment of adding (in async callback)
    if (state.referenceImages.length >= 14) {
      if (state.referenceImages.length === 14) {
        alert(t('alerts.max_images') || 'Maximum 14 images autorisées');
      }
      return;
    }
    
    if (e.target?.result) {
      state.referenceImages.push(e.target.result as string);
      renderReferenceImages();
      const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
      if (fileInput) fileInput.value = '';
    }
  };
  reader.readAsDataURL(file);
}

export function renderReferenceImages(): void {
  const container = document.getElementById('previewContainer');
  const dropZone = document.getElementById('dropZone');
  const clearAllBtn = document.getElementById('clearAllBtn');
  
  // Update counter
  const countMsg = document.getElementById('imageCount');
  if (countMsg) {
    countMsg.textContent = `${state.referenceImages.length}/14`;
  }
  
  // If no images, reset everything
  if (state.referenceImages.length === 0) {
    if (container) container.style.display = 'none';
    if (dropZone) dropZone.style.display = 'flex';
    if (clearAllBtn) clearAllBtn.style.display = 'none';
    if (dropZone) {
      dropZone.classList.remove('compact', 'disabled');
    }
    return;
  }
  
  // Show images container and clear button
  if (container) container.style.display = 'grid';
  if (clearAllBtn) clearAllBtn.style.display = 'block';
  
  // Keep dropZone visible but more compact
  if (dropZone) {
    dropZone.style.display = 'flex';
    dropZone.classList.add('compact');
  }
  
  // Disable dropZone if we reach maximum
  if (state.referenceImages.length >= 14) {
    if (dropZone) {
      dropZone.classList.add('disabled');
      dropZone.style.pointerEvents = 'none';
      dropZone.style.opacity = '0.5';
    }
  } else {
    if (dropZone) {
      dropZone.classList.remove('disabled');
      dropZone.style.pointerEvents = 'auto';
      dropZone.style.opacity = '1';
    }
  }
  
  if (container) {
    container.innerHTML = state.referenceImages.map((img, index) => `
      <div class="preview-img-wrapper">
        <img src="${img}" class="preview-img" alt="Référence ${index + 1}">
        <button class="remove-img" data-index="${index}">
          <i class="fa-solid fa-times"></i>
        </button>
      </div>
    `).join('');
    
    // Attach events to delete buttons
    container.querySelectorAll('.remove-img').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index') || '0');
        removeImage(index);
      });
    });
  }
}

export function removeImage(index: number): void {
  state.referenceImages.splice(index, 1);
  renderReferenceImages();
}

export function clearImage(): void {
  state.referenceImages = [];
  const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
  if (fileInput) fileInput.value = '';
  renderReferenceImages();
}

export async function displayResult(url: string, prompt: string): Promise<void> {
  const img = document.getElementById('finalImage') as HTMLImageElement | null;
  const loader = document.getElementById('loader');
  const placeholder = document.getElementById('placeholder');
  const statusText = document.getElementById('statusText');
  const actionsBar = document.getElementById('actionsBar');
  const downloadLink = document.getElementById('downloadLink') as HTMLAnchorElement | null;
  
  if (!img) return;
  
  // Reset display
  img.classList.add('hidden');
  if (loader) loader.classList.remove('hidden');
  if (placeholder) placeholder.classList.add('hidden');
  
  // Update status text
  if (statusText) statusText.innerText = t('app.status_loading');
  
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
      if (loader) loader.classList.add('hidden');
      img.classList.remove('hidden');
      
      if (downloadLink) {
        downloadLink.href = blobUrl;
        downloadLink.download = `nano-thumbnail-${Date.now()}.png`;
      }
      
      if (actionsBar) {
        actionsBar.classList.remove('hidden');
        actionsBar.style.display = 'flex';
      }
    };

    img.onerror = () => {
      throw new Error("Image load failed");
    };

  } catch (e) {
    console.error("Image display error:", e);
    if (loader) loader.classList.add('hidden');
    
    img.src = url;
    img.classList.remove('hidden');

    alert(t('alerts.error_display'));
    
    if (downloadLink) {
      downloadLink.href = url;
    }
    if (actionsBar) {
      actionsBar.classList.remove('hidden');
      actionsBar.style.display = 'flex';
    }
  }
}

/* --- INIT APP --- */
export function initApp(): void {
  // Check if API key exists, if not show settings
  if (!state.apiKey) {
    openSettings();
  }
  
  // Render history
  renderHistory();
  
  // Image Upload Logic Listeners
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput') as HTMLInputElement | null;
  
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.length) {
        Array.from(target.files).forEach(file => {
          processFile(file);
        });
      }
    });
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--primary)';
    });
    
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--border)';
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = 'var(--border)';
      if (e.dataTransfer?.files.length) {
        Array.from(e.dataTransfer.files).forEach(file => {
          processFile(file);
        });
      }
    });
  }
  
  // Initialize reference images rendering
  renderReferenceImages();
  
  // Settings modal buttons
  const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSettingsBtn');
  
  if (cancelSettingsBtn) {
    cancelSettingsBtn.addEventListener('click', closeSettings);
  }
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', saveSettings);
  }
  
  // History panel buttons
  const historyBtn = document.getElementById('historyBtn');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const apiBtn = document.getElementById('apiBtn');
  
  if (historyBtn) {
    historyBtn.addEventListener('click', toggleHistory);
  }
  if (closeHistoryBtn) {
    closeHistoryBtn.addEventListener('click', toggleHistory);
  }
  if (apiBtn) {
    apiBtn.addEventListener('click', openSettings);
  }
  
  // Clear all images button
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearImage);
  }
}
