// Application state management

export interface HistoryItem {
  prompt: string;
  url: string;
  date: string;
  localId?: string; // ID for local IndexedDB storage
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
    return stored ? JSON.parse(stored) : [];
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
