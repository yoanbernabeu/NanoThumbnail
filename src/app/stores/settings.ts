import { create } from 'zustand';
import type { AspectRatio, GenerationParams, ModelId, OutputFormat, Provider, Resolution, SafetyLevel } from '../lib/types';

export type Theme = 'light' | 'dark' | 'system';
export type Lang = 'en' | 'fr';
/** Where API keys live: across sessions (localStorage) or until the tab closes (sessionStorage). */
export type KeyPersistence = 'local' | 'session';

interface SettingsState {
  provider: Provider;
  keys: Record<Provider, string>;
  keyPersistence: KeyPersistence;
  model: ModelId;
  aspectRatio: AspectRatio;
  resolution: Resolution;
  format: OutputFormat;
  safety: SafetyLevel;
  count: 1 | 2 | 4;
  theme: Theme;
  lang: Lang;

  set: (patch: Partial<Omit<SettingsState, 'set' | 'setKey' | 'params' | 'apiKey'>>) => void;
  setKey: (provider: Provider, key: string) => void;
  params: () => GenerationParams;
  apiKey: () => string;
}

const PROVIDERS: Provider[] = ['replicate', 'gemini', 'openrouter'];
const PREFS_KEY = 'nt_prefs';
const KEY_PREFIX = 'nt_key_';

function safeGet(storage: Storage | undefined, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}
function safeSet(storage: Storage | undefined, key: string, value: string | null): void {
  try {
    if (value === null || value === '') storage?.removeItem(key);
    else storage?.setItem(key, value);
  } catch {
    /* storage unavailable (private mode, quota) */
  }
}

const hasWindow = typeof window !== 'undefined';
const local = hasWindow ? window.localStorage : undefined;
const session = hasWindow ? window.sessionStorage : undefined;

/** Carry over v1 keys (nano_api_key_*) once. */
function migrateV1(): void {
  const legacy: Array<[string, Provider]> = [
    ['nano_api_key_replicate', 'replicate'],
    ['nano_api_key', 'replicate'],
    ['nano_api_key_gemini', 'gemini'],
  ];
  for (const [oldKey, provider] of legacy) {
    const value = safeGet(local, oldKey);
    if (value && !safeGet(local, KEY_PREFIX + provider)) safeSet(local, KEY_PREFIX + provider, value);
    if (value) safeSet(local, oldKey, null);
  }
  const oldProvider = safeGet(local, 'nano_provider');
  const oldModel = safeGet(local, 'nano_model');
  if ((oldProvider || oldModel) && !safeGet(local, PREFS_KEY)) {
    safeSet(local, PREFS_KEY, JSON.stringify({ provider: oldProvider ?? undefined, model: oldModel ?? undefined }));
  }
}

function detectLang(): Lang {
  if (!hasWindow) return 'en';
  const param = new URLSearchParams(location.search).get('lang');
  const stored = safeGet(local, 'nano_lang');
  const browser = navigator.language.split('-')[0];
  for (const candidate of [param, stored, browser]) {
    if (candidate === 'en' || candidate === 'fr') return candidate;
  }
  return 'en';
}

function load() {
  if (hasWindow) migrateV1();
  const prefs = JSON.parse(safeGet(local, PREFS_KEY) || '{}');
  const keyPersistence: KeyPersistence = prefs.keyPersistence === 'session' ? 'session' : 'local';
  const store = keyPersistence === 'session' ? session : local;
  return {
    provider: (PROVIDERS.includes(prefs.provider) ? prefs.provider : 'replicate') as Provider,
    keys: Object.fromEntries(PROVIDERS.map((p) => [p, safeGet(store, KEY_PREFIX + p) ?? ''])) as Record<Provider, string>,
    keyPersistence,
    model: (prefs.model === 'nano-banana-2' ? 'nano-banana-2' : 'nano-banana-pro') as ModelId,
    aspectRatio: (prefs.aspectRatio ?? '16:9') as AspectRatio,
    resolution: (prefs.resolution ?? '2K') as Resolution,
    format: (prefs.format ?? 'png') as OutputFormat,
    safety: (prefs.safety ?? 'block_only_high') as SafetyLevel,
    count: ([1, 2, 4].includes(prefs.count) ? prefs.count : 1) as 1 | 2 | 4,
    theme: (['light', 'dark', 'system'].includes(prefs.theme) ? prefs.theme : 'system') as Theme,
    lang: detectLang(),
  };
}

function persistPrefs(s: SettingsState): void {
  const { provider, keyPersistence, model, aspectRatio, resolution, format, safety, count, theme } = s;
  safeSet(local, PREFS_KEY, JSON.stringify({ provider, keyPersistence, model, aspectRatio, resolution, format, safety, count, theme }));
  safeSet(local, 'nano_lang', s.lang);
}

function persistKeys(s: SettingsState): void {
  const [keep, clear] = s.keyPersistence === 'session' ? [session, local] : [local, session];
  for (const provider of PROVIDERS) {
    safeSet(keep, KEY_PREFIX + provider, s.keys[provider]);
    safeSet(clear, KEY_PREFIX + provider, null);
  }
}

export const useSettings = create<SettingsState>((set, get) => ({
  ...load(),
  set: (patch) => {
    set(patch);
    persistPrefs(get());
    if ('keyPersistence' in patch) persistKeys(get());
  },
  setKey: (provider, key) => {
    set({ keys: { ...get().keys, [provider]: key.trim() } });
    persistKeys(get());
  },
  params: () => {
    const { provider, model, aspectRatio, resolution, format, safety } = get();
    return { provider, model, aspectRatio, resolution, format: provider === 'replicate' ? format : 'png', safety };
  },
  apiKey: () => get().keys[get().provider],
}));
