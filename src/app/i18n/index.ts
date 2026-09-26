import { useCallback } from 'react';
import { useSettings, type Lang } from '../stores/settings';
import { en, type Dict } from './en';
import { fr } from './fr';

const dicts: Record<Lang, Dict> = { en, fr };

type Path<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Path<T[K], `${P}${K}.`>;
}[keyof T & string];
export type TKey = Path<Dict>;

export function translate(lang: Lang, key: TKey, vars?: Record<string, string | number>): string {
  let value: unknown = dicts[lang];
  for (const part of key.split('.')) value = (value as Record<string, unknown>)?.[part];
  let text = typeof value === 'string' ? value : key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

export function useT() {
  const lang = useSettings((s) => s.lang);
  return useCallback((key: TKey, vars?: Record<string, string | number>) => translate(lang, key, vars), [lang]);
}

/** For non-React code (stores, toasts fired from async flows). */
export function t(key: TKey, vars?: Record<string, string | number>): string {
  return translate(useSettings.getState().lang, key, vars);
}
