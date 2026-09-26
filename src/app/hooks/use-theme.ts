import { useEffect, useSyncExternalStore } from 'react';
import { useSettings } from '../stores/settings';

const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-color-scheme: dark)') : null;

function subscribe(cb: () => void) {
  query?.addEventListener('change', cb);
  return () => query?.removeEventListener('change', cb);
}

function useSystemDark(): boolean {
  return useSyncExternalStore(subscribe, () => query?.matches ?? true, () => true);
}

export function useResolvedTheme(): 'light' | 'dark' {
  const theme = useSettings((s) => s.theme);
  const systemDark = useSystemDark();
  return theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;
}

/** Keeps the `dark` class on <html> in sync with the setting. */
export function useApplyTheme(): void {
  const resolved = useResolvedTheme();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark');
  }, [resolved]);
}
