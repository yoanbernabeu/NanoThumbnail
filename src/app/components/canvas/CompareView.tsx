import { Download, Loader2, Trophy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { useBlobUrl } from '../../hooks/use-blob-url';
import { useWorkspace } from '../../stores/workspace';
import { exportTestCompare } from '../../lib/exporting';
import { useT } from '../../i18n';
import type { Generation } from '../../lib/types';
import { cn } from '../../lib/utils';

function CompareTile({ gen, rank, reason, onOpen }: { gen: Generation; rank?: number; reason?: string; onOpen: () => void }) {
  const url = useBlobUrl(gen.blob);
  return (
    <figure className="space-y-2">
      <button
        type="button"
        onClick={onOpen}
        className={cn('relative block w-full overflow-hidden rounded-lg border bg-muted', rank === 0 && 'ring-2 ring-primary')}
      >
        <img src={url} alt={gen.prompt} className="aspect-video w-full object-cover" />
        {rank !== undefined && (
          <span
            className={cn(
              'absolute top-2 left-2 flex h-6 min-w-6 items-center justify-center gap-1 rounded-full px-2 text-xs font-semibold',
              rank === 0 ? 'bg-primary text-primary-foreground' : 'bg-black/70 text-white',
            )}
          >
            {rank === 0 && <Trophy className="size-3" />}#{rank + 1}
          </span>
        )}
      </button>
      {reason && <figcaption className="text-xs text-muted-foreground">{reason}</figcaption>}
    </figure>
  );
}

export function CompareView() {
  const t = useT();
  const { pickedIds, generations, ranking, ranking_busy, rankPicked, select, setView } = useWorkspace();
  const picked = pickedIds.map((id) => generations.find((g) => g.id === id)).filter((g): g is Generation => !!g);

  if (picked.length < 2) {
    return <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">{t('canvas.compareHint')}</div>;
  }

  const rankOf = (id: string) => {
    if (!ranking) return undefined;
    const index = ranking.ids.indexOf(id);
    return index < 0 ? undefined : ranking.result.order.indexOf(index);
  };
  const reasonOf = (id: string) => {
    if (!ranking) return undefined;
    const index = ranking.ids.indexOf(id);
    return index < 0 ? undefined : ranking.result.reasons[index];
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={rankPicked} disabled={ranking_busy} className="gap-2">
            {ranking_busy ? <Loader2 className="animate-spin" /> : <Trophy />}
            {ranking_busy ? t('score.compareRunning') : t('score.compare')}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              await exportTestCompare(picked);
              toast.success(t('filmstrip.exported'));
            }}
          >
            <Download /> {t('filmstrip.exportTestCompare', { n: Math.min(picked.length, 3) })}
          </Button>
          <p className="text-xs text-muted-foreground">{t('score.disclaimer')}</p>
        </div>

        {ranking?.result.winnerWhy && (
          <p className="rounded-lg border bg-card p-3 text-sm">
            <span className="font-medium text-primary">{t('score.winner')} · </span>
            {ranking.result.winnerWhy}
          </p>
        )}

        <div className={cn('grid gap-4', picked.length === 2 ? 'grid-cols-2' : 'grid-cols-2 xl:grid-cols-3')}>
          {picked.map((g) => (
            <CompareTile
              key={g.id}
              gen={g}
              rank={rankOf(g.id)}
              reason={reasonOf(g.id)}
              onOpen={() => {
                select(g.id);
                setView('image');
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
