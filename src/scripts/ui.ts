import { state, type HistoryItem, type GenerationParameters, type ApiProvider } from './state';
import { t } from './i18n/index';
import { saveImage, getImage, getAllImages, deleteImage } from './storage';

// DOM Elements cache
let historyPanel: HTMLElement | null = null;
let libraryPanel: HTMLElement | null = null;
let settingsModal: HTMLElement | null = null;

// Persona constants & types
const PERSONA_PREFIX = 'persona_';
const PERSONA_STORAGE_KEY = 'nano_personas';

interface PersonaMetadata {
  id: string;
  name: string;
  timestamp: number;
}

let pendingPersonaPhotos: { left: string | null; front: string | null; right: string | null } = {
  left: null,
  front: null,
  right: null
};

/* --- NAVIGATION --- */
export function openSettings(): void {
  const providerSelect = document.getElementById('providerSelect') as HTMLSelectElement | null;
  const apiKeyReplicateInput = document.getElementById('apiKeyReplicateInput') as HTMLInputElement | null;
  const apiKeyGeminiInput = document.getElementById('apiKeyGeminiInput') as HTMLInputElement | null;
  const apiKeyOpenRouterInput = document.getElementById('apiKeyOpenRouterInput') as HTMLInputElement | null;
  const saveLocallyCheckbox = document.getElementById('saveLocallyCheckbox') as HTMLInputElement | null;
  settingsModal = document.getElementById('settingsModal');

  if (providerSelect) {
    providerSelect.value = state.provider;
    providerSelect.addEventListener('change', () => {
      toggleProviderKeyGroup(providerSelect.value as ApiProvider);
    });
  }
  if (apiKeyReplicateInput) {
    apiKeyReplicateInput.value = state.apiKeyReplicate;
  }
  if (apiKeyGeminiInput) {
    apiKeyGeminiInput.value = state.apiKeyGemini;
  }
  if (apiKeyOpenRouterInput) {
    apiKeyOpenRouterInput.value = state.apiKeyOpenRouter;
  }
  if (saveLocallyCheckbox) {
    saveLocallyCheckbox.checked = state.saveLocally;
  }
  toggleProviderKeyGroup(state.provider);
  if (settingsModal) {
    settingsModal.classList.remove('hidden');
  }
}

function toggleProviderKeyGroup(provider: ApiProvider): void {
  const replicateGroup = document.getElementById('replicateKeyGroup');
  const geminiGroup = document.getElementById('geminiKeyGroup');
  const openrouterGroup = document.getElementById('openrouterKeyGroup');
  
  // Hide all groups first
  replicateGroup?.classList.add('hidden');
  geminiGroup?.classList.add('hidden');
  openrouterGroup?.classList.add('hidden');
  
  // Show the appropriate group
  if (provider === 'gemini') {
    geminiGroup?.classList.remove('hidden');
  } else if (provider === 'openrouter') {
    openrouterGroup?.classList.remove('hidden');
  } else {
    replicateGroup?.classList.remove('hidden');
  }
}

export function closeSettings(): void {
  settingsModal = document.getElementById('settingsModal');
  if (settingsModal) {
    settingsModal.classList.add('hidden');
  }
}

export function saveSettings(): void {
  const providerSelect = document.getElementById('providerSelect') as HTMLSelectElement | null;
  const apiKeyReplicateInput = document.getElementById('apiKeyReplicateInput') as HTMLInputElement | null;
  const apiKeyGeminiInput = document.getElementById('apiKeyGeminiInput') as HTMLInputElement | null;
  const apiKeyOpenRouterInput = document.getElementById('apiKeyOpenRouterInput') as HTMLInputElement | null;
  const saveLocallyCheckbox = document.getElementById('saveLocallyCheckbox') as HTMLInputElement | null;

  const provider = (providerSelect?.value || 'replicate') as ApiProvider;
  const replicateKey = apiKeyReplicateInput?.value.trim() || '';
  const geminiKey = apiKeyGeminiInput?.value.trim() || '';
  const openrouterKey = apiKeyOpenRouterInput?.value.trim() || '';
  
  let activeKey: string;
  switch (provider) {
    case 'gemini':
      activeKey = geminiKey;
      break;
    case 'openrouter':
      activeKey = openrouterKey;
      break;
    case 'replicate':
    default:
      activeKey = replicateKey;
      break;
  }

  if (!activeKey) {
    alert(t('alerts.enter_api_key'));
    return;
  }

  // Save provider
  state.provider = provider;
  localStorage.setItem('nano_provider', provider);

  // Save keys
  state.apiKeyReplicate = replicateKey;
  state.apiKeyGemini = geminiKey;
  state.apiKeyOpenRouter = openrouterKey;
  localStorage.setItem('nano_api_key_replicate', replicateKey);
  localStorage.setItem('nano_api_key_gemini', geminiKey);
  localStorage.setItem('nano_api_key_openrouter', openrouterKey);

  // Update active key shortcut
  state.apiKey = activeKey;

  // Save local storage preference
  const saveLocally = saveLocallyCheckbox?.checked || false;
  state.saveLocally = saveLocally;
  localStorage.setItem('nano_save_locally', saveLocally.toString());

  updateProviderDependentUI();
  closeSettings();
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

    // 2. If not local, fetch directly from URL (delivery URLs support CORS)
    if (!base64Data && item.url) {
      const response = await fetch(item.url);
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

/* --- PERSONA LOGIC --- */
function getPersonas(): PersonaMetadata[] {
  try {
    const raw = localStorage.getItem(PERSONA_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePersonasMetadata(personas: PersonaMetadata[]): void {
  localStorage.setItem(PERSONA_STORAGE_KEY, JSON.stringify(personas));
}

export function openPersonaModal(): void {
  pendingPersonaPhotos = { left: null, front: null, right: null };
  const modal = document.getElementById('personaModal');
  const nameInput = document.getElementById('personaNameInput') as HTMLInputElement | null;
  if (nameInput) nameInput.value = '';

  // Reset drop zones
  modal?.querySelectorAll('.persona-drop-zone').forEach(zone => {
    zone.classList.remove('has-image');
    const preview = zone.querySelector('.persona-preview') as HTMLImageElement | null;
    const placeholder = zone.querySelector('.persona-placeholder') as HTMLElement | null;
    if (preview) { preview.classList.add('hidden'); preview.src = ''; }
    if (placeholder) placeholder.style.display = 'flex';
  });

  if (modal) modal.classList.remove('hidden');
}

export function closePersonaModal(): void {
  const modal = document.getElementById('personaModal');
  if (modal) modal.classList.add('hidden');
}

export async function savePersona(): Promise<void> {
  const nameInput = document.getElementById('personaNameInput') as HTMLInputElement | null;
  const name = nameInput?.value.trim() || '';

  if (!name) {
    alert(t('persona.name_required'));
    return;
  }

  if (!pendingPersonaPhotos.left || !pendingPersonaPhotos.front || !pendingPersonaPhotos.right) {
    alert(t('persona.all_photos_required'));
    return;
  }

  const id = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    await saveImage(`${PERSONA_PREFIX}${id}_left`, pendingPersonaPhotos.left);
    await saveImage(`${PERSONA_PREFIX}${id}_front`, pendingPersonaPhotos.front);
    await saveImage(`${PERSONA_PREFIX}${id}_right`, pendingPersonaPhotos.right);

    const personas = getPersonas();
    personas.unshift({ id, name, timestamp: Date.now() });
    savePersonasMetadata(personas);

    closePersonaModal();
    renderLibrary();
  } catch (error) {
    console.error('Failed to save persona:', error);
  }
}

export function initPersonaDropZones(): void {
  const zones = document.querySelectorAll('.persona-drop-zone');
  zones.forEach(zone => {
    const position = zone.getAttribute('data-position') as 'left' | 'front' | 'right';
    const fileInput = zone.querySelector('.persona-file-input') as HTMLInputElement;
    const preview = zone.querySelector('.persona-preview') as HTMLImageElement;
    const placeholder = zone.querySelector('.persona-placeholder') as HTMLElement;

    zone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('click', (e) => e.stopPropagation());

    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) handlePersonaFile(file, position, preview, placeholder, zone as HTMLElement);
      fileInput.value = '';
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      (zone as HTMLElement).style.borderColor = 'var(--primary)';
    });

    zone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      (zone as HTMLElement).style.borderColor = '';
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      (zone as HTMLElement).style.borderColor = '';
      const file = (e as DragEvent).dataTransfer?.files[0];
      if (file) handlePersonaFile(file, position, preview, placeholder, zone as HTMLElement);
    });
  });
}

function handlePersonaFile(file: File, position: 'left' | 'front' | 'right', preview: HTMLImageElement, placeholder: HTMLElement, zone: HTMLElement): void {
  if (!file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const base64 = e.target?.result as string;
    if (base64) {
      pendingPersonaPhotos[position] = base64;
      preview.src = base64;
      preview.classList.remove('hidden');
      placeholder.style.display = 'none';
      zone.classList.add('has-image');
    }
  };
  reader.readAsDataURL(file);
}

export async function addPersonaAsReference(personaId: string): Promise<void> {
  if (state.referenceImages.length + 3 > 14) {
    alert(t('persona.not_enough_room'));
    return;
  }

  try {
    const left = await getImage(`${PERSONA_PREFIX}${personaId}_left`);
    const front = await getImage(`${PERSONA_PREFIX}${personaId}_front`);
    const right = await getImage(`${PERSONA_PREFIX}${personaId}_right`);

    if (left && front && right) {
      state.referenceImages.push(left, front, right);
      renderReferenceImages();
      toggleLibrary();
    }
  } catch (error) {
    console.error('Failed to add persona as reference:', error);
  }
}

export async function deletePersona(personaId: string): Promise<void> {
  if (!confirm(t('persona.delete_confirm'))) return;

  try {
    await deleteImage(`${PERSONA_PREFIX}${personaId}_left`);
    await deleteImage(`${PERSONA_PREFIX}${personaId}_front`);
    await deleteImage(`${PERSONA_PREFIX}${personaId}_right`);

    const personas = getPersonas().filter(p => p.id !== personaId);
    savePersonasMetadata(personas);
    renderLibrary();
  } catch (error) {
    console.error('Failed to delete persona:', error);
  }
}

/* --- LIBRARY LOGIC --- */
const LIBRARY_PREFIX = 'ref_';

export async function renderLibrary(): Promise<void> {
  const list = document.getElementById('libraryList');
  if (!list) return;

  const personas = getPersonas();
  const images = await getAllImages(LIBRARY_PREFIX);

  if (personas.length === 0 && images.length === 0) {
    list.innerHTML = `<p class="empty-msg" data-i18n="library.empty">${t('library.empty') || 'Aucune image sauvegardée.'}</p>`;
    return;
  }

  let html = '';

  // Persona section
  if (personas.length > 0) {
    html += `<div class="library-section-header">${t('persona.title') || 'Personas'}</div>`;

    for (const persona of personas) {
      const left = await getImage(`${PERSONA_PREFIX}${persona.id}_left`);
      const front = await getImage(`${PERSONA_PREFIX}${persona.id}_front`);
      const right = await getImage(`${PERSONA_PREFIX}${persona.id}_right`);

      html += `
        <div class="persona-item">
          <div class="persona-name">${escapeHtml(persona.name)}</div>
          <div class="persona-grid">
            ${left ? `<img src="${left}" class="persona-thumb" alt="Left">` : ''}
            ${front ? `<img src="${front}" class="persona-thumb" alt="Front">` : ''}
            ${right ? `<img src="${right}" class="persona-thumb" alt="Right">` : ''}
          </div>
          <div class="persona-actions">
            <button class="library-btn add-persona-ref-btn" data-persona-id="${persona.id}">
              <i class="fa-solid fa-plus"></i>
              <span>${t('persona.add_as_reference') || 'Ajouter comme référence'}</span>
            </button>
            <button class="library-btn delete-btn" data-persona-id="${persona.id}">
              <i class="fa-solid fa-trash"></i>
              <span>${t('persona.delete') || 'Supprimer'}</span>
            </button>
          </div>
        </div>
      `;
    }
  }

  // Images section
  if (images.length > 0) {
    if (personas.length > 0) {
      html += `<div class="library-section-header" style="margin-top:1rem">${t('library.title') || 'Images'}</div>`;
    }

    html += images.map((img, index) => `
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
  }

  list.innerHTML = html;

  // Attach event listeners for persona add-as-reference buttons
  const addPersonaRefBtns = list.querySelectorAll('.add-persona-ref-btn');
  addPersonaRefBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-persona-id');
      if (id) await addPersonaAsReference(id);
    });
  });

  // Attach event listeners for persona delete buttons
  const deletePersonaBtns = list.querySelectorAll('.persona-item .delete-btn[data-persona-id]');
  deletePersonaBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-persona-id');
      if (id) await deletePersona(id);
    });
  });

  // Attach event listeners for image add buttons
  const addBtns = list.querySelectorAll('.add-ref-btn');
  addBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (id) await addFromLibrary(id);
    });
  });

  // Attach event listeners for image delete buttons
  const deleteBtns = list.querySelectorAll('.library-item .delete-btn[data-id]');
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

/* --- REMIX LOGIC --- */
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function fetchYouTubeTitle(videoId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.title || null;
  } catch {
    return null;
  }
}

async function fetchYouTubeThumbnail(videoId: string): Promise<string | null> {
  const qualities = ['maxresdefault', 'hqdefault'];

  // Try direct fetch first (YouTube supports CORS)
  for (const quality of qualities) {
    try {
      const url = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
      const response = await fetch(url);
      if (!response.ok) continue;
      const blob = await response.blob();
      return await blobToBase64(blob);
    } catch {
      continue;
    }
  }

  // Fallback to Netlify proxy
  try {
    const response = await fetch(
      `/.netlify/functions/youtube-thumbnail-proxy?videoId=${videoId}`
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.base64 || null;
  } catch {
    return null;
  }
}

function setRemixStatus(message: string, type: 'loading' | 'error' | 'success'): void {
  const status = document.getElementById('remixStatus');
  if (!status) return;
  status.textContent = message;
  status.className = `remix-status ${type}`;
  status.classList.remove('hidden');
}

function hideRemixStatus(): void {
  const status = document.getElementById('remixStatus');
  if (status) status.classList.add('hidden');
}

async function handleRemixLoad(): Promise<void> {
  const urlInput = document.getElementById('remixUrlInput') as HTMLInputElement | null;
  const url = urlInput?.value.trim() || '';

  if (!url) return;

  const videoId = extractYouTubeVideoId(url);
  if (!videoId) {
    setRemixStatus(t('remix.error_invalid_url'), 'error');
    return;
  }

  setRemixStatus(t('remix.loading'), 'loading');

  const [title, thumbnail] = await Promise.all([
    fetchYouTubeTitle(videoId),
    fetchYouTubeThumbnail(videoId),
  ]);

  if (!thumbnail) {
    setRemixStatus(t('remix.error_fetch_failed'), 'error');
    return;
  }

  // Set title in the title input field
  if (title) {
    const titleInput = document.getElementById('titleInput') as HTMLInputElement | null;
    if (titleInput) titleInput.value = title;
  }

  // Add thumbnail to reference images
  if (state.referenceImages.length < 14) {
    state.referenceImages.push(thumbnail);
    renderReferenceImages();
  }

  // Show remix preview
  const preview = document.getElementById('remixPreview');
  const remixThumb = document.getElementById('remixThumbnail') as HTMLImageElement | null;
  const remixTitle = document.getElementById('remixTitle');

  if (preview) preview.classList.remove('hidden');
  if (remixThumb) remixThumb.src = thumbnail;
  if (remixTitle) remixTitle.textContent = title || '';

  setRemixStatus(t('remix.thumbnail_loaded'), 'success');
  setTimeout(hideRemixStatus, 2000);
}

function clearRemix(): void {
  const urlInput = document.getElementById('remixUrlInput') as HTMLInputElement | null;
  const preview = document.getElementById('remixPreview');
  const remixThumb = document.getElementById('remixThumbnail') as HTMLImageElement | null;
  const remixTitle = document.getElementById('remixTitle');

  if (urlInput) urlInput.value = '';
  if (preview) preview.classList.add('hidden');
  if (remixThumb) remixThumb.src = '';
  if (remixTitle) remixTitle.textContent = '';

  hideRemixStatus();
}

/* --- PROVIDER-DEPENDENT UI --- */
export function updateProviderDependentUI(): void {
  const isGemini = state.provider === 'gemini';
  const isOpenRouter = state.provider === 'openrouter';
  const isNonReplicate = isGemini || isOpenRouter;

  // Hide format select for Gemini and OpenRouter (PNG only)
  const formatGroup = document.getElementById('formatSelect')?.closest('.setting-group') as HTMLElement | null;
  if (formatGroup) {
    formatGroup.style.display = isNonReplicate ? 'none' : '';
  }

  // Hide match_input_image option for Gemini and OpenRouter
  const aspectRatioSelect = document.getElementById('aspectRatioSelect') as HTMLSelectElement | null;
  if (aspectRatioSelect) {
    const matchOption = aspectRatioSelect.querySelector('option[value="match_input_image"]') as HTMLOptionElement | null;
    if (matchOption) {
      matchOption.style.display = isNonReplicate ? 'none' : '';
      // If currently selected, switch to 16:9
      if (isNonReplicate && aspectRatioSelect.value === 'match_input_image') {
        aspectRatioSelect.value = '16:9';
      }
    }
  }

  // Hide resolution select for Gemini (not applicable)
  const resolutionGroup = document.getElementById('resolutionSelect')?.closest('.setting-group') as HTMLElement | null;
  if (resolutionGroup) {
    resolutionGroup.style.display = isGemini ? 'none' : '';
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

  // Apply provider-dependent UI
  updateProviderDependentUI();

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

  // Persona modal buttons
  const createPersonaBtn = document.getElementById('createPersonaBtn');
  const cancelPersonaBtn = document.getElementById('cancelPersonaBtn');
  const savePersonaBtn = document.getElementById('savePersonaBtn');

  if (createPersonaBtn) {
    createPersonaBtn.addEventListener('click', openPersonaModal);
  }
  if (cancelPersonaBtn) {
    cancelPersonaBtn.addEventListener('click', closePersonaModal);
  }
  if (savePersonaBtn) {
    savePersonaBtn.addEventListener('click', savePersona);
  }

  initPersonaDropZones();

  // Remix listeners
  const remixLoadBtn = document.getElementById('remixLoadBtn');
  const remixClearBtn = document.getElementById('remixClearBtn');
  const remixUrlInput = document.getElementById('remixUrlInput');

  if (remixLoadBtn) {
    remixLoadBtn.addEventListener('click', handleRemixLoad);
  }
  if (remixClearBtn) {
    remixClearBtn.addEventListener('click', clearRemix);
  }
  if (remixUrlInput) {
    remixUrlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleRemixLoad();
      }
    });
  }

  // Listen for language changes to re-render dynamic content
  window.addEventListener('languageChanged', () => {
    renderHistory();
    renderLibrary();
  });
}
