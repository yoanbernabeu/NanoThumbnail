// Application state management

export interface GenerationParameters {
  resolution: string;
  aspect_ratio: string;
  output_format: string;
  safety_filter_level: string;
}

export interface HistoryItem {
  prompt: string;
  url: string;
  date: string;
  localId?: string; // ID for local IndexedDB storage
  parameters?: GenerationParameters;
}

export interface AppState {
  apiKey: string;
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

export const state: AppState = {
  apiKey: localStorage.getItem('nano_api_key') || '',
  proxyUrl: 'https://corsproxy.io/?',
  history: loadHistory(),
  referenceImages: [],
  saveLocally: localStorage.getItem('nano_save_locally') === 'true'
};
