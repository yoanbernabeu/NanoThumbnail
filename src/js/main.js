import '../styles/style.css';
import { state } from './state.js';
import * as UI from './ui.js';
import { generateImage } from './api.js';
import { initI18n } from './i18n/i18n.js';

// Attach functions to window for HTML onclick handlers
window.showLanding = UI.showLanding;
window.startApp = UI.startApp;
window.openSettings = UI.openSettings;
window.closeSettings = UI.closeSettings;
window.saveSettings = UI.saveSettings;
window.toggleHistory = UI.toggleHistory;
window.clearImage = UI.clearImage;
window.generateImage = generateImage;

// Special case for history click which passed 'this'
window.loadHistoryImageByIndex = function(element) {
    try {
        const index = parseInt(element.getAttribute('data-index'));
        if (index >= 0 && index < state.history.length) {
            const item = state.history[index];
            UI.loadHistoryImage(item.url, item.prompt);
        }
    } catch (e) {
        console.error('Error loading history image:', e);
    }
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initI18n(); // Init Internationalization first
    
    UI.renderHistory();

    // Image Upload Logic Listeners
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    
    if (dropZone && fileInput) {
        dropZone.addEventListener('click', () => fileInput.click());
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) {
                UI.processFile(e.target.files[0]);
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
            if (e.dataTransfer.files.length) {
                UI.processFile(e.dataTransfer.files[0]);
            }
        });
    }
});
