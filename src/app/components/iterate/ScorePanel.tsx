import { BarChart3, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { Section } from '../Section';
import { useWorkspace } from '../../stores/workspace';
import { useT, type TKey } from '../../i18n';
import type { Generation } from '../../lib/types';
import { cn } from '../../lib/utils';

function tone(score: number, max: number) {
  const r = score / max;
  return r >= 0.75 ? 'bg-success' : r >= 0.5 ? 'bg-warning' : 'bg-destructive';
}

function Gauge({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 30;
  return (
    <div className="relative size-20">
      <svg viewBox="0 0 72 72" className="size-full -rotate-90">
        <circle cx="36" cy="36" r="30" fill="none" strokeWidth="6" className="stroke-muted" />
        <circle
          cx="36"
          cy="36"
          r="30"
          fill="none"
          strokeWidth="6"
          strokeLinecap="round"
          className={cn(value >= 75 ? 'stroke-success' : value >= 50 ? 'stroke-warning' : 'stroke-destructive')}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <span className="tabular absolute inset-0 flex items-center justify-center text-xl font-semibold">{value}</span>
    </div>
  );
}

export function ScorePanel({ gen, onApplyEdit }: { gen: Generation; onApplyEdit: () => void }) {
  const t = useT();
  const { score, scoring, edit } = useWorkspace();
  const busy = scoring === gen.id;
  const s = gen.score;

  if (!s) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <BarChart3 className="size-8 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{t('score.disclaimer')}</p>
        <Button onClick={() => score(gen.id)} disabled={busy} className="gap-2">
          {busy ? <Loader2 className="animate-spin" /> : <BarChart3 />}
          {busy ? t('score.running') : t('score.run')}
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-6 p-4">
        <div className="flex items-center gap-4">
          <Gauge value={s.overall} />
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs text-muted-foreground">{t('score.disclaimer')}</p>
            <Button variant="outline" size="xs" onClick={() => score(gen.id)} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <RefreshCw />} {t('score.rerun')}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {s.criteria.map((c) => (
            <div key={c.key} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{t(`score.criteria.${c.key}` as TKey)}</span>
                <span className="tabular text-muted-foreground">{c.score}/10</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className={cn('h-full rounded-full', tone(c.score, 10))} style={{ width: `${c.score * 10}%` }} />
              </div>
              {c.comment && <p className="text-xs text-muted-foreground">{c.comment}</p>}
            </div>
          ))}
        </div>

        {s.suggestedEdits.length > 0 && (
          <Section title={t('score.suggested')}>
            <div className="space-y-1.5">
              {s.suggestedEdits.map((e) => (
                <div key={e} className="flex items-start gap-2 rounded-md border p-2 text-sm">
                  <span className="flex-1">{e}</span>
                  <Button
                    size="xs"
                    variant="secondary"
                    onClick={() => {
                      edit(e);
                      onApplyEdit();
                    }}
                  >
                    <Wand2 /> {t('score.applyEdit')}
                  </Button>
                </div>
              ))}
            </div>
          </Section>
        )}

        {s.strengths.length > 0 && (
          <Section title={t('score.strengths')}>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {s.strengths.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Section>
        )}
        {s.improvements.length > 0 && (
          <Section title={t('score.improvements')}>
            <ul className="list-disc space-y-1 pl-4 text-sm">
              {s.improvements.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
          </Section>
        )}
      </div>
    </ScrollArea>
  );
}
