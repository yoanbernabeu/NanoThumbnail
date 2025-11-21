export const state = {
    apiKey: localStorage.getItem('nano_api_key') || '',
    proxyUrl: 'https://corsproxy.io/?', 
    history: JSON.parse(localStorage.getItem('nano_history') || '[]'),
    currentImageBase64: null
};

