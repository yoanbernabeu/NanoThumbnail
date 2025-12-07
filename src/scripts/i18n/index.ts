import { fr } from './fr';
import { en } from './en';

type TranslationValue = string | Record<string, unknown>;
type Translations = Record<string, TranslationValue>;

const translations: Record<string, Translations> = { fr, en };

let currentLang = 'fr';

export function initI18n(): void {
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
  const langSelect = document.getElementById('langSelect') as HTMLSelectElement | null;
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      setLanguage(target.value);
    });
  }
}

export function setLanguage(lang: string): void {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('nano_lang', lang);
  applyTranslations();
  
  // Dispatch event for other components if needed
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

export function t(key: string): string {
  const keys = key.split('.');
  let value: unknown = translations[currentLang];
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key; // Fallback to key if missing
    }
  }
  return typeof value === 'string' ? value : key;
}

export function getCurrentLang(): string {
  return currentLang;
}

function applyTranslations(): void {
  // Update HTML elements with data-i18n
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;
    
    const translation = t(key);
    
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
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

// Auto-init when module is loaded
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
  } else {
    initI18n();
  }
}
