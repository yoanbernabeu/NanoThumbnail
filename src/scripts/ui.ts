import { state, type HistoryItem, type GenerationParameters } from './state';
import { t } from './i18n/index';
import { saveImage, getImage, getAllImages, deleteImage } from './storage';

// DOM Elements cache
let historyPanel: HTMLElement | null = null;
let libraryPanel: HTMLElement | null = null;
let settingsModal: HTMLElement | null = null;

/* --- NAVIGATION --- */
export function openSettings(): void {
  const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement | null;
  const saveLocallyCheckbox = document.getElementById('saveLocallyCheckbox') as HTMLInputElement | null;
  settingsModal = document.getElementById('settingsModal');

  if (apiKeyInput) {
    apiKeyInput.value = state.apiKey;
  }
  if (saveLocallyCheckbox) {
    saveLocallyCheckbox.checked = state.saveLocally;
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
  const saveLocallyCheckbox = document.getElementById('saveLocallyCheckbox') as HTMLInputElement | null;
  const key = apiKeyInput?.value.trim() || '';

  if (key) {
    state.apiKey = key;
    localStorage.setItem('nano_api_key', key);

    // Save local storage preference
    const saveLocally = saveLocallyCheckbox?.checked || false;
    state.saveLocally = saveLocally;
    localStorage.setItem('nano_save_locally', saveLocally.toString());

    closeSettings();
  } else {
    alert(t('alerts.enter_api_key'));
  }
}

export function toggleHistory(): void {
  historyPanel = document.getElementById('historyPanel');
  libraryPanel = document.getElementById('libraryPanel');

  // Close library panel if open
  if (libraryPanel?.classList.contains('open')) {
    libraryPanel.classList.remove('open');
  }

  if (historyPanel) {
    historyPanel.classList.toggle('open');
  }
}

export function toggleLibrary(): void {
  libraryPanel = document.getElementById('libraryPanel');
  historyPanel = document.getElementById('historyPanel');

  // Close history panel if open
  if (historyPanel?.classList.contains('open')) {
    historyPanel.classList.remove('open');
  }

  if (libraryPanel) {
    libraryPanel.classList.toggle('open');
    if (libraryPanel.classList.contains('open')) {
      renderLibrary();
    }
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

export async function addToHistory(prompt: string, url: string, base64Data?: string, parameters?: GenerationParameters): Promise<void> {
  const localId = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const newItem: HistoryItem = {
    prompt,
    url,
    date: new Date().toLocaleTimeString(),
    localId: state.saveLocally ? localId : undefined,
    parameters
  };

  // Save image locally if option is enabled and base64 data is provided
  if (state.saveLocally && base64Data) {
    try {
      await saveImage(localId, base64Data);
    } catch (error) {
      console.error('Failed to save image locally:', error);
      newItem.localId = undefined;
    }
  }

  state.history.unshift(newItem);

  // Smart eviction: if limit reached (10), prioritize removing non-local items
  if (state.history.length > 10) {
    // Find index of the last non-local item (starting from the end)
    let indexToRemove = -1;
    for (let i = state.history.length - 1; i >= 0; i--) {
      if (!state.history[i].localId) {
        indexToRemove = i;
        break;
      }
    }

    // If no non-local item found, remove the last item (oldest)
    if (indexToRemove === -1) {
      indexToRemove = state.history.length - 1;
    }

    state.history.splice(indexToRemove, 1);
  }

  localStorage.setItem('nano_history', JSON.stringify(state.history));
  renderHistory();
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export async function renderHistory(): Promise<void> {
  const list = document.getElementById('historyList');
  if (!list) return;

  if (state.history.length === 0) {
    list.innerHTML = `<p style="color: var(--text-muted);">${t('history.empty')}</p>`;
    return;
  }

  // Resolve image URLs (local or remote)
  const itemsWithUrls = await Promise.all(
    state.history.map(async (item) => {
      let imageUrl = item.url;
      if (item.localId) {
        try {
          const localData = await getImage(item.localId);
          if (localData) {
            imageUrl = localData;
          }
        } catch {
          // Fallback to remote URL
        }
      }
      return { ...item, resolvedUrl: imageUrl };
    })
  );

  list.innerHTML = itemsWithUrls.map((item, index) => {
    const safePrompt = escapeHtml(item.prompt);
    return `
      <div class="history-item">
        <img src="${item.resolvedUrl}" class="history-img" loading="lazy" data-index="${index}" style="cursor:pointer">
        <p class="history-prompt">${safePrompt}</p>
        <div class="history-meta">
            <small style="color:var(--text-muted)">${item.date}</small>
            ${item.parameters ? `
            <button class="reuse-btn" data-index="${index}" title="${t('history.reuse') || 'Réutiliser'}">
                <i class="fa-solid fa-rotate-left"></i>
                <span>${t('history.reuse') || 'Réutiliser'}</span>
            </button>` : ''}
            
            <button class="reuse-btn use-ref-btn" data-index="${index}" title="${t('history.use_reference') || 'Utiliser comme référence'}">
                <i class="fa-solid fa-image"></i>
                <span>${t('history.use_reference') || 'Utiliser comme référence'}</span>
            </button>
        </div>
      </div>
    `;
  }).join('');

  const imgs = list.querySelectorAll('.history-img');
  imgs.forEach(img => {
    img.addEventListener('click', async () => {
      const index = parseInt(img.getAttribute('data-index') || '0');
      if (index >= 0 && index < state.history.length) {
        const item = state.history[index];
        let imageUrl = item.url;
        if (item.localId) {
          try {
            const localData = await getImage(item.localId);
            if (localData) {
              imageUrl = localData;
            }
          } catch {
            // Fallback to remote URL
          }
        }
        loadHistoryImage(imageUrl, item.prompt);
      }
    });
  });

  // Attach events to reuse buttons
  const reuseBtns = list.querySelectorAll('.reuse-btn:not(.use-ref-btn)');
  reuseBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent triggering the image click
      const index = parseInt(btn.getAttribute('data-index') || '0');
      if (index >= 0 && index < state.history.length) {
        reuseGeneration(state.history[index]);
      }
    });
  });

  // Attach events to use-ref buttons
  const useRefBtns = list.querySelectorAll('.use-ref-btn');
  useRefBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const index = parseInt(btn.getAttribute('data-index') || '0');
      if (index >= 0 && index < state.history.length) {
        useAsReference(state.history[index]);
      }
    });
  });
}

export function reuseGeneration(item: HistoryItem): void {
  if (!item.parameters) return;

  const promptInput = document.getElementById('promptInput') as HTMLTextAreaElement | null;
  const resolutionSelect = document.getElementById('resolutionSelect') as HTMLSelectElement | null;
  const aspectRatioSelect = document.getElementById('aspectRatioSelect') as HTMLSelectElement | null;
  const formatSelect = document.getElementById('formatSelect') as HTMLSelectElement | null;
  const safetySelect = document.getElementById('safetySelect') as HTMLSelectElement | null;

  if (promptInput) promptInput.value = item.prompt;
  if (resolutionSelect) resolutionSelect.value = item.parameters.resolution;
  if (aspectRatioSelect) aspectRatioSelect.value = item.parameters.aspect_ratio;
  if (formatSelect) formatSelect.value = item.parameters.output_format;
  if (safetySelect) safetySelect.value = item.parameters.safety_filter_level;

  // Close history panel
  toggleHistory();

  // Scroll to top or focus prompt
  promptInput?.focus();
}

export async function useAsReference(item: HistoryItem): Promise<void> {
  // Check limit
  if (state.referenceImages.length >= 14) {
    alert(t('alerts.max_images') || 'Maximum 14 images autorisées');
    return;
  }

  try {
    let base64Data: string | null = null;

    // 1. Try to get from local storage if available
    if (item.localId) {
      base64Data = await getImage(item.localId);
    }

    // 2. If not local, fetch from URL
    if (!base64Data && item.url) {
      // Use proxy to avoid CORS
      const proxyUrl = `${state.proxyUrl}${encodeURIComponent(item.url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      base64Data = await blobToBase64(blob);
    }

    if (base64Data) {
      state.referenceImages.push(base64Data);
      renderReferenceImages();

      // Close history panel
      toggleHistory();

      // Scroll to reference section or show feedback
      const refSection = document.getElementById('previewContainer');
      refSection?.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error('Failed to use as reference:', error);
    alert(t('alerts.error_display')); // Generic error message
  }
}

/* --- LIBRARY LOGIC --- */
const LIBRARY_PREFIX = 'ref_';

export async function renderLibrary(): Promise<void> {
  const list = document.getElementById('libraryList');
  if (!list) return;

  const images = await getAllImages(LIBRARY_PREFIX);

  if (images.length === 0) {
    list.innerHTML = `<p class="empty-msg" data-i18n="library.empty">${t('library.empty') || 'Aucune image sauvegardée.'}</p>`;
    return;
  }

  list.innerHTML = images.map((img, index) => `
    <div class="library-item">
      <img src="${img.base64}" alt="Reference ${index + 1}" class="library-img" data-id="${img.id}">
      <div class="library-actions">
        <button class="library-btn add-ref-btn" data-id="${img.id}">
          <i class="fa-solid fa-plus"></i>
          <span>${t('library.add') || 'Ajouter comme référence'}</span>
        </button>
        <button class="library-btn delete-btn" data-id="${img.id}">
          <i class="fa-solid fa-trash"></i>
          <span>${t('library.delete') || 'Supprimer'}</span>
        </button>
      </div>
    </div>
  `).join('');

  // Attach event listeners for add buttons
  const addBtns = list.querySelectorAll('.add-ref-btn');
  addBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (id) await addFromLibrary(id);
    });
  });

  // Attach event listeners for delete buttons
  const deleteBtns = list.querySelectorAll('.delete-btn');
  deleteBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (id) await deleteFromLibrary(id);
    });
  });
}

export async function saveToLibrary(base64Data: string): Promise<void> {
  const id = `${LIBRARY_PREFIX}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  try {
    await saveImage(id, base64Data);
    console.log('Saved to library:', id);
  } catch (error) {
    console.error('Failed to save to library:', error);
    alert(t('alerts.error_api') || 'Erreur lors de la sauvegarde.');
  }
}

export async function addFromLibrary(id: string): Promise<void> {
  if (state.referenceImages.length >= 14) {
    alert(t('alerts.max_images') || 'Maximum 14 images autorisées');
    return;
  }

  try {
    const base64 = await getImage(id);
    if (base64) {
      state.referenceImages.push(base64);
      renderReferenceImages();
      toggleLibrary();
      const refSection = document.getElementById('previewContainer');
      refSection?.scrollIntoView({ behavior: 'smooth' });
    }
  } catch (error) {
    console.error('Failed to add from library:', error);
  }
}

export async function deleteFromLibrary(id: string): Promise<void> {
  try {
    await deleteImage(id);
    renderLibrary();
  } catch (error) {
    console.error('Failed to delete from library:', error);
  }
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

export async function renderReferenceImages(): Promise<void> {
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
    // Check which images are already in the library
    const libraryImages = await getAllImages(LIBRARY_PREFIX);
    const libraryBase64Set = new Set(libraryImages.map(img => img.base64));

    container.innerHTML = state.referenceImages.map((img, index) => {
      const isInLibrary = libraryBase64Set.has(img);
      return `
      <div class="preview-img-wrapper">
        <img src="${img}" class="preview-img" alt="Référence ${index + 1}">
        <button class="remove-img" data-index="${index}" title="${t('library.delete') || 'Supprimer'}">
          <i class="fa-solid fa-times"></i>
        </button>
        <button class="save-to-lib-btn ${isInLibrary ? 'in-library' : ''}" data-index="${index}" title="${isInLibrary ? (t('library.already_saved') || 'Déjà sauvegardé') : (t('library.save') || 'Sauvegarder')}" ${isInLibrary ? 'disabled' : ''}>
          <i class="fa-solid fa-bookmark"></i>
        </button>
      </div>
    `;
    }).join('');

    // Attach events to delete buttons
    container.querySelectorAll('.remove-img').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.getAttribute('data-index') || '0');
        removeImage(index);
      });
    });

    // Attach events to save-to-library buttons (only for those not in library)
    container.querySelectorAll('.save-to-lib-btn:not(.in-library)').forEach(btn => {
      btn.addEventListener('click', async () => {
        const index = parseInt(btn.getAttribute('data-index') || '0');
        if (index >= 0 && index < state.referenceImages.length) {
          await saveToLibrary(state.referenceImages[index]);
          // Visual feedback: change to in-library state
          btn.classList.add('in-library');
          (btn as HTMLButtonElement).disabled = true;
          btn.setAttribute('title', t('library.already_saved') || 'Déjà sauvegardé');
          const icon = btn.querySelector('i');
          if (icon) {
            icon.classList.remove('fa-bookmark');
            icon.classList.add('fa-check');
            setTimeout(() => {
              icon.classList.remove('fa-check');
              icon.classList.add('fa-bookmark');
            }, 1500);
          }
        }
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

export async function displayResult(url: string, prompt: string): Promise<string | undefined> {
  const img = document.getElementById('finalImage') as HTMLImageElement | null;
  const loader = document.getElementById('loader');
  const placeholder = document.getElementById('placeholder');
  const statusText = document.getElementById('statusText');
  const actionsBar = document.getElementById('actionsBar');
  const downloadLink = document.getElementById('downloadLink') as HTMLAnchorElement | null;

  if (!img) return undefined;

  // Reset display
  img.classList.add('hidden');
  if (loader) loader.classList.remove('hidden');
  if (placeholder) placeholder.classList.add('hidden');

  // Update status text
  if (statusText) statusText.innerText = t('app.status_loading');

  let base64Data: string | undefined;

  try {
    let finalSrc = url;
    let blobUrl = url;

    if (url.startsWith('http')) {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch image');
      const blob = await response.blob();
      blobUrl = URL.createObjectURL(blob);
      finalSrc = blobUrl;

      // Convert to base64 for local storage if enabled
      if (state.saveLocally) {
        base64Data = await blobToBase64(blob);
      }
    }

    img.src = finalSrc;

    await new Promise<void>((resolve, reject) => {
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
        resolve();
      };

      img.onerror = () => {
        reject(new Error("Image load failed"));
      };
    });

    return base64Data;

  } catch (e) {
    console.warn("Image fetch failed, falling back to direct load:", e);
    if (loader) loader.classList.add('hidden');

    img.src = url;
    img.classList.remove('hidden');

    if (downloadLink) {
      downloadLink.href = url;
    }
    if (actionsBar) {
      actionsBar.classList.remove('hidden');
      actionsBar.style.display = 'flex';
    }
    return undefined;
  }
}

/**
 * Convert a Blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
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

  // Library panel buttons
  const libraryBtn = document.getElementById('libraryBtn');
  const closeLibraryBtn = document.getElementById('closeLibraryBtn');

  if (libraryBtn) {
    libraryBtn.addEventListener('click', toggleLibrary);
  }
  if (closeLibraryBtn) {
    closeLibraryBtn.addEventListener('click', toggleLibrary);
  }

  // Clear all images button
  const clearAllBtn = document.getElementById('clearAllBtn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', clearImage);
  }

  // Listen for language changes to re-render dynamic content
  window.addEventListener('languageChanged', () => {
    renderHistory();
    renderLibrary();
  });
}
