// Application state management

export type ApiProvider = 'replicate' | 'gemini';
export type ModelId = 'nano-banana-pro' | 'nano-banana-2';

export interface GenerationParameters {
  resolution: string;
  aspect_ratio: string;
  output_format: string;
  safety_filter_level: string;
  provider?: ApiProvider;
  model?: ModelId;
}

export interface HistoryItem {
  prompt: string;
  url: string;
  date: string;
  localId: string;        // Unique ID, also key in IndexedDB history store
  timestamp: number;       // Unix ms, used for sorting
  parameters?: GenerationParameters;
}

export interface AppState {
  provider: ApiProvider;
  model: ModelId;
  apiKey: string;
  apiKeyReplicate: string;
  apiKeyGemini: string;
  proxyUrl: string;
  history: HistoryItem[];
  referenceImages: string[];
  saveLocally: boolean;
}

// Migration: move legacy nano_api_key → nano_api_key_replicate
function migrateApiKey(): void {
  const legacy = localStorage.getItem('nano_api_key');
  if (legacy && !localStorage.getItem('nano_api_key_replicate')) {
    localStorage.setItem('nano_api_key_replicate', legacy);
    localStorage.removeItem('nano_api_key');
  }
}

migrateApiKey();

const provider = (localStorage.getItem('nano_provider') as ApiProvider) || 'replicate';
const model = (localStorage.getItem('nano_model') as ModelId) || 'nano-banana-pro';
const apiKeyReplicate = localStorage.getItem('nano_api_key_replicate') || '';
const apiKeyGemini = localStorage.getItem('nano_api_key_gemini') || '';

export const state: AppState = {
  provider,
  model,
  apiKey: provider === 'gemini' ? apiKeyGemini : apiKeyReplicate,
  apiKeyReplicate,
  apiKeyGemini,
  proxyUrl: '/.netlify/functions/replicate-proxy?url=',
  history: [],            // Loaded asynchronously from IndexedDB in initApp()
  referenceImages: [],
  saveLocally: localStorage.getItem('nano_save_locally') === 'true'
};
