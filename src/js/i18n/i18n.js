import { fr } from './fr.js';
import { en } from './en.js';

const translations = { fr, en };

export let currentLang = 'fr'; // Default

export function initI18n() {
    // Detect language: URL param > LocalStorage > Browser > Default
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    const storedLang = localStorage.getItem('nano_lang');
    const browserLang = navigator.language.split('-')[0];

    if (langParam && translations[langParam]) {
        currentLang = langParam;
    } else if (storedLang && translations[storedLang]) {
        currentLang = storedLang;
    } else if (translations[browserLang]) {
        currentLang = browserLang;
    }

    // Save preference
    localStorage.setItem('nano_lang', currentLang);

    // Apply to DOM
    applyTranslations();
    
    // Update Select if exists
    const langSelect = document.getElementById('langSelect');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
        });
    }
}

export function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLang = lang;
    localStorage.setItem('nano_lang', lang);
    applyTranslations();
    
    // Dispatch event for other components if needed
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

export function t(key) {
    const keys = key.split('.');
    let value = translations[currentLang];
    
    for (const k of keys) {
        if (value && value[k]) {
            value = value[k];
        } else {
            return key; // Fallback to key if missing
        }
    }
    return value;
}

function applyTranslations() {
    // Update HTML elements with data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translation = t(key);
        
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            if (el.hasAttribute('placeholder')) {
                el.placeholder = translation;
            }
        } else {
            el.innerHTML = translation;
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = currentLang;
}

