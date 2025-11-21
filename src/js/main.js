import '../styles/style.css';
import './modules/errors/styles/errors.css';
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
window.removeImage = UI.removeImage;
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
            // Traiter tous les fichiers sélectionnés
            if (e.target.files.length) {
                Array.from(e.target.files).forEach(file => {
                    UI.processFile(file);
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
            // Traiter tous les fichiers droppés
            if (e.dataTransfer.files.length) {
                Array.from(e.dataTransfer.files).forEach(file => {
                    UI.processFile(file);
                });
            }
        });
    }
    
    // Initialiser le rendu des images de référence
    UI.renderReferenceImages();
});
