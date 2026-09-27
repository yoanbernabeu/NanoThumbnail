import { useEffect, useState } from 'react';
import { ImagePlus, Loader2, Plus, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Separator } from '../ui/separator';
import { Field } from '../Section';
import { Thumb } from '../Thumb';
import { useUI } from '../../stores/ui';
import { useWorkspace } from '../../stores/workspace';
import { useSettings } from '../../stores/settings';
import { analyseChannelStyle } from '../../lib/ai';
import { extractVideoId, fetchThumbnail } from '../../lib/youtube';
import { normaliseUpload } from '../../lib/images';
import { explainError } from '../../lib/errors';
import { useT } from '../../i18n';
import type { BrandKit } from '../../lib/types';

export function BrandKitDialog() {
  const t = useT();
  const open = useUI((s) => s.dialog === 'brand');
  const close = useUI((s) => s.close);
  const { brand, saveBrand } = useWorkspace();
  const [draft, setDraft] = useState<BrandKit>(brand);
  const [urls, setUrls] = useState('');
  const [analysing, setAnalysing] = useState(false);

  useEffect(() => {
    if (open) setDraft(brand);
  }, [open, brand]);

  const patch = (p: Partial<BrandKit>) => setDraft((d) => ({ ...d, ...p }));

  async function analyse() {
    const ids = urls
      .split(/\s+/)
      .map(extractVideoId)
      .filter((x): x is string => !!x)
      .slice(0, 5);
    const settings = useSettings.getState();
    const apiKey = settings.apiKey();
    if (!apiKey) return void toast.error(t('brief.needKey'));
    if (ids.length === 0 && draft.styleRefs.length === 0) return void toast.error(t('brief.youtubeError'));

    setAnalysing(true);
    try {
      const fetched = (await Promise.all(ids.map(fetchThumbnail))).filter((b): b is Blob => !!b);
      const refs = [...draft.styleRefs, ...fetched].slice(-5);
      const profile = await analyseChannelStyle({ provider: settings.provider, apiKey }, refs);
      patch({ styleRefs: refs, styleProfile: profile });
      setUrls('');
    } catch (error) {
      toast.error(t(explainError(error).key), { description: explainError(error).message });
    } finally {
      setAnalysing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('brand.title')}</DialogTitle>
          <DialogDescription>{t('brand.description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Field label={t('brand.channelName')} htmlFor="channel">
            <Input id="channel" value={draft.channelName} onChange={(e) => patch({ channelName: e.target.value })} />
          </Field>

          <Field label={t('brand.colors')}>
            <div className="flex flex-wrap items-center gap-2">
              {draft.colors.map((c, i) => (
                <div key={i} className="group relative">
                  <label className="block size-9 cursor-pointer overflow-hidden rounded-md border" style={{ background: c }}>
                    <input
                      type="color"
                      value={c}
                      onChange={(e) => patch({ colors: draft.colors.map((x, j) => (j === i ? e.target.value : x)) })}
                      className="size-full cursor-pointer opacity-0"
                      aria-label={c}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => patch({ colors: draft.colors.filter((_, j) => j !== i) })}
                    className="absolute -top-1.5 -right-1.5 hidden rounded-full bg-foreground p-0.5 text-background group-hover:block [@media(pointer:coarse)]:block"
                    aria-label={t('common.remove')}
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
              {draft.colors.length < 6 && (
                <Button variant="outline" size="icon" onClick={() => patch({ colors: [...draft.colors, '#7c5cff'] })} aria-label={t('brand.addColor')}>
                  <Plus />
                </Button>
              )}
            </div>
          </Field>

          <Field label={t('brand.fontStyle')} htmlFor="font">
            <Input id="font" value={draft.fontStyle} onChange={(e) => patch({ fontStyle: e.target.value })} placeholder={t('brand.fontStylePlaceholder')} />
          </Field>

          <Field label={t('brand.notes')} htmlFor="notes">
            <Input id="notes" value={draft.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder={t('brand.notesPlaceholder')} />
          </Field>

          <Field label={t('brand.logo')}>
            <div className="flex items-center gap-2">
              {draft.logo && <Thumb blob={draft.logo} className="size-12" onRemove={() => patch({ logo: undefined })} removeLabel={t('common.remove')} />}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = async () => input.files?.[0] && patch({ logo: await normaliseUpload(input.files[0], 1024) });
                  input.click();
                }}
              >
                <ImagePlus /> {t('common.add')}
              </Button>
            </div>
          </Field>

          <Separator />

          <Field label={t('brand.styleProfile')} hint={t('brand.styleProfileHint')}>
            <Textarea
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder={t('brand.styleUrlsPlaceholder')}
              className="min-h-16 font-mono text-xs"
            />
            <Button variant="secondary" size="sm" className="mt-2" onClick={analyse} disabled={analysing}>
              {analysing ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {analysing ? t('brand.analysing') : t('brand.analyse')}
            </Button>
          </Field>

          {draft.styleRefs.length > 0 && (
            <div className="space-y-2">
              <div className="grid grid-cols-5 gap-1.5">
                {draft.styleRefs.map((b, i) => (
                  <Thumb
                    key={i}
                    blob={b}
                    className="aspect-video"
                    onRemove={() => patch({ styleRefs: draft.styleRefs.filter((_, j) => j !== i) })}
                    removeLabel={t('common.remove')}
                  />
                ))}
              </div>
              <label className="flex items-center justify-between gap-3 text-sm">
                {t('brand.sendStyleRefs')}
                <Switch checked={draft.sendStyleRefs} onCheckedChange={(v) => patch({ sendStyleRefs: v })} />
              </label>
            </div>
          )}

          <Textarea
            value={draft.styleProfile}
            onChange={(e) => patch({ styleProfile: e.target.value })}
            placeholder={t('brand.profilePlaceholder')}
            className="min-h-28 text-sm"
            aria-label={t('brand.styleProfile')}
          />
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={close}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={async () => {
              const configured = !!(draft.styleProfile || draft.colors.length || draft.fontStyle || draft.logo);
              await saveBrand({ ...draft, enabled: draft.enabled || (configured && !brand.updatedAt) });
              close();
            }}
          >
            {t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
