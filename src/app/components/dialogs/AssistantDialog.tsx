import { useState } from 'react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Field } from '../Section';
import { useUI } from '../../stores/ui';
import { useWorkspace } from '../../stores/workspace';
import { useSettings } from '../../stores/settings';
import { suggestConcepts, type Concept } from '../../lib/ai';
import { STYLES, findStyle } from '../../lib/styles';
import { explainError } from '../../lib/errors';
import { useT } from '../../i18n';

export function AssistantDialog() {
  const t = useT();
  const open = useUI((s) => s.dialog === 'assistant');
  const close = useUI((s) => s.close);
  const { brief, setBrief } = useWorkspace();
  const lang = useSettings((s) => s.lang);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (!brief.videoTitle.trim() && !brief.brief.trim()) return void toast.error(t('assistant.needTitle'));
    const settings = useSettings.getState();
    const apiKey = settings.apiKey();
    if (!apiKey) return void toast.error(t('brief.needKey'));
    setBusy(true);
    try {
      setConcepts(
        await suggestConcepts(
          { provider: settings.provider, apiKey },
          {
            videoTitle: brief.videoTitle,
            idea: brief.brief,
            lang: settings.lang,
            styles: STYLES.map((s) => ({ id: s.id, name: s.name.en })),
          },
        ),
      );
    } catch (error) {
      const info = explainError(error);
      toast.error(t(info.key), { description: info.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> {t('assistant.title')}
          </DialogTitle>
          <DialogDescription>{t('assistant.description')}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
        >
          <div className="min-w-0 flex-1">
            <Field label={t('brief.videoTitle')} htmlFor="aTitle">
              <Input id="aTitle" value={brief.videoTitle} onChange={(e) => setBrief({ videoTitle: e.target.value })} placeholder={t('brief.videoTitlePlaceholder')} />
            </Field>
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />}
            {busy ? t('assistant.running') : t('assistant.run')}
          </Button>
        </form>

        {busy && concepts.length === 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        )}

        {concepts.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-3">
            {concepts.map((c, i) => {
              const style = findStyle(c.styleId);
              return (
                <div key={i} className="flex flex-col gap-2 rounded-lg border bg-card p-3">
                  <p className="font-medium">{c.name}</p>
                  {style && <Badge variant="secondary" className="w-fit">{style.name[lang]}</Badge>}
                  <p className="text-sm text-muted-foreground">{c.brief}</p>
                  <p className="text-xs">
                    <span className="text-muted-foreground">{t('assistant.textOnThumb')} : </span>
                    <span className="font-medium">{c.overlayText || t('assistant.noText')}</span>
                  </p>
                  <p className="text-xs text-muted-foreground italic">{c.why}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-auto"
                    onClick={() => {
                      setBrief({ brief: c.brief, overlayText: c.overlayText, styleId: style?.id ?? brief.styleId });
                      close();
                    }}
                  >
                    {t('assistant.use')} <ArrowRight />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
