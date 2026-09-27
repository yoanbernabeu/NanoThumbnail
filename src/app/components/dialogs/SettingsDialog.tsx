import { useEffect, useRef, useState } from 'react';
import { Download, ExternalLink, Eye, EyeOff, Loader2, ShieldCheck, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Field } from '../Section';
import { useUI } from '../../stores/ui';
import { useSettings, type KeyPersistence, type Theme } from '../../stores/settings';
import { useWorkspace } from '../../stores/workspace';
import { exportBackup, importBackup } from '../../lib/backup';
import { storageEstimate } from '../../lib/db';
import { downloadBlob } from '../../lib/images';
import { explainError } from '../../lib/errors';
import { useT } from '../../i18n';
import type { Provider } from '../../lib/types';

const KEY_LINKS: Record<Provider, string> = {
  replicate: 'https://replicate.com/account/api-tokens',
  gemini: 'https://aistudio.google.com/apikey',
  openrouter: 'https://openrouter.ai/settings/keys',
};

const KEY_PLACEHOLDERS: Record<Provider, string> = {
  replicate: 'r8_…',
  gemini: 'AIza…',
  openrouter: 'sk-or-…',
};

function formatBytes(n: number): string {
  if (n < 1e6) return `${Math.round(n / 1e3)} KB`;
  if (n < 1e9) return `${(n / 1e6).toFixed(1)} MB`;
  return `${(n / 1e9).toFixed(1)} GB`;
}

export function SettingsDialog() {
  const t = useT();
  const open = useUI((s) => s.dialog === 'settings');
  const close = useUI((s) => s.close);
  const s = useSettings();
  const [reveal, setReveal] = useState(false);
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) storageEstimate().then(setUsage);
  }, [open]);

  async function doExport() {
    setBusy('export');
    try {
      const blob = await exportBackup();
      downloadBlob(blob, `nanothumbnail-backup-${new Date().toISOString().slice(0, 10)}.zip`);
    } catch (error) {
      toast.error(explainError(error).message);
    } finally {
      setBusy(null);
    }
  }

  async function doImport(file: File) {
    setBusy('import');
    try {
      await importBackup(file);
      await useWorkspace.getState().init();
      toast.success(t('settings.imported'));
    } catch (error) {
      toast.error(explainError(error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('settings.title')}</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-success" /> {t('settings.privacy')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Field label={t('settings.provider')}>
            <ToggleGroup type="single" variant="outline" className="w-full" value={s.provider} onValueChange={(v) => v && s.set({ provider: v as Provider })}>
              <ToggleGroupItem value="replicate" className="h-auto min-h-9 min-w-0 flex-1 leading-tight whitespace-normal">
                {t('settings.replicate')}
              </ToggleGroupItem>
              <ToggleGroupItem value="gemini" className="h-auto min-h-9 min-w-0 flex-1 leading-tight whitespace-normal">
                {t('settings.gemini')}
              </ToggleGroupItem>
              <ToggleGroupItem value="openrouter" className="h-auto min-h-9 min-w-0 flex-1 leading-tight whitespace-normal">
                {t('settings.openrouter')}
              </ToggleGroupItem>
            </ToggleGroup>
            <p className="text-xs text-muted-foreground">{t(`settings.${s.provider}Hint`)}</p>
          </Field>

          <Field
            label={
              <span className="flex items-center justify-between">
                {t('settings.apiKey')}
                <a href={KEY_LINKS[s.provider]} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-normal text-primary hover:underline">
                  {t('settings.getKey')} <ExternalLink className="size-3" />
                </a>
              </span>
            }
            htmlFor="apiKey"
          >
            <div className="relative">
              <Input
                id="apiKey"
                type={reveal ? 'text' : 'password'}
                autoComplete="off"
                spellCheck={false}
                value={s.keys[s.provider]}
                onChange={(e) => s.setKey(s.provider, e.target.value)}
                placeholder={KEY_PLACEHOLDERS[s.provider]}
                className="pr-10 font-mono text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setReveal(!reveal)}
                aria-label={reveal ? 'Hide' : 'Show'}
              >
                {reveal ? <EyeOff /> : <Eye />}
              </Button>
            </div>
          </Field>

          <Field label={t('settings.keyStorage')} hint={s.keyPersistence === 'session' ? t('settings.keySessionHint') : undefined}>
            <ToggleGroup
              type="single"
              variant="outline"
              size="sm"
              className="w-full"
              value={s.keyPersistence}
              onValueChange={(v) => v && s.set({ keyPersistence: v as KeyPersistence })}
            >
              <ToggleGroupItem value="local" className="h-auto min-h-9 min-w-0 flex-1 leading-tight whitespace-normal">
                {t('settings.keyLocal')}
              </ToggleGroupItem>
              <ToggleGroupItem value="session" className="h-auto min-h-9 min-w-0 flex-1 leading-tight whitespace-normal">
                {t('settings.keySession')}
              </ToggleGroupItem>
            </ToggleGroup>
          </Field>

          <Separator />

          <Field label={t('settings.appearance')}>
            <div className="flex flex-wrap gap-2">
              <ToggleGroup type="single" variant="outline" size="sm" className="min-w-52 flex-1" value={s.theme} onValueChange={(v) => v && s.set({ theme: v as Theme })}>
                {(['light', 'dark', 'system'] as const).map((v) => (
                  <ToggleGroupItem key={v} value={v} className="min-w-0 flex-1">
                    {t(`topbar.${v}`)}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <ToggleGroup type="single" variant="outline" size="sm" value={s.lang} onValueChange={(v) => v && s.set({ lang: v as 'en' | 'fr' })}>
                <ToggleGroupItem value="fr">FR</ToggleGroupItem>
                <ToggleGroupItem value="en">EN</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </Field>

          <Separator />

          <Field label={t('settings.data')} hint={usage ? t('settings.storage', { used: formatBytes(usage.usage), quota: formatBytes(usage.quota) }) : undefined}>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={doExport} disabled={!!busy}>
                {busy === 'export' ? <Loader2 className="animate-spin" /> : <Download />} {t('settings.exportAll')}
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()} disabled={!!busy}>
                {busy === 'import' ? <Loader2 className="animate-spin" /> : <Upload />} {t('settings.importAll')}
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept=".zip,application/zip"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) doImport(file);
                  e.target.value = '';
                }}
              />
            </div>
          </Field>
        </div>
      </DialogContent>
    </Dialog>
  );
}
