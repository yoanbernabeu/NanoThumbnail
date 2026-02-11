// Application state management

export type ApiProvider = 'replicate' | 'gemini' | 'openrouter';

export interface GenerationParameters {
  resolution: string;
  aspect_ratio: string;
  output_format: string;
  safety_filter_level: string;
  provider?: ApiProvider;
}

export interface HistoryItem {
  prompt: string;
  url: string;
  date: string;
  localId?: string; // ID for local IndexedDB storage
  parameters?: GenerationParameters;
}

export interface AppState {
  provider: ApiProvider;
  apiKey: string;
  apiKeyReplicate: string;
  apiKeyGemini: string;
  apiKeyOpenRouter: string;
  proxyUrl: string;
  history: HistoryItem[];
  referenceImages: string[];
  saveLocally: boolean;
}

function loadHistory(): HistoryItem[] {
  try {
    const stored = localStorage.getItem('nano_history');
    if (!stored) return [];

    const parsed: HistoryItem[] = JSON.parse(stored);
    // Filter out items that are not saved locally (no localId)
    return parsed.filter(item => item.localId);
  } catch {
    return [];
  }
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
const apiKeyReplicate = localStorage.getItem('nano_api_key_replicate') || '';
const apiKeyGemini = localStorage.getItem('nano_api_key_gemini') || '';
const apiKeyOpenRouter = localStorage.getItem('nano_api_key_openrouter') || '';

function getActiveApiKey(): string {
  switch (provider) {
    case 'gemini':
      return apiKeyGemini;
    case 'openrouter':
      return apiKeyOpenRouter;
    case 'replicate':
    default:
      return apiKeyReplicate;
  }
}

export const state: AppState = {
  provider,
  apiKey: getActiveApiKey(),
  apiKeyReplicate,
  apiKeyGemini,
  apiKeyOpenRouter,
  proxyUrl: '/.netlify/functions/replicate-proxy?url=',
  history: loadHistory(),
  referenceImages: [],
  saveLocally: localStorage.getItem('nano_save_locally') === 'true'
};
