import { useState } from 'react';
import { Check, Download, GitBranch, Grid2x2, Star, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Toggle } from './ui/toggle';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useBlobUrl } from '../hooks/use-blob-url';
import { useWorkspace } from '../stores/workspace';
import { exportTestCompare } from '../lib/exporting';
import { useT } from '../i18n';
import type { Generation } from '../lib/types';
import { cn } from '../lib/utils';

function Tile({
  gen,
  selected,
  picked,
  onSelect,
  onPick,
  pickLabel,
}: {
  gen: Generation;
  selected: boolean;
  picked: boolean;
  onSelect: (e: React.MouseEvent | React.KeyboardEvent) => void;
  onPick: () => void;
  pickLabel: string;
}) {
  const url = useBlobUrl(gen.blob);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect(e)}
      title={gen.prompt}
      className={cn(
        'group relative h-full shrink-0 cursor-pointer overflow-hidden rounded-md border bg-muted transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring',
        selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : 'opacity-80 hover:opacity-100',
      )}
      style={{ aspectRatio: `${gen.width} / ${gen.height}` }}
    >
      <img src={url} alt="" className="size-full object-cover" loading="lazy" draggable={false} />
      {gen.favorite && <Star className="absolute top-1 left-1 size-3 fill-amber-400 text-amber-400 drop-shadow" />}
      {gen.parentId && <GitBranch className="absolute bottom-1 left-1 size-3 text-white drop-shadow" />}
      {gen.score && (
        <span className="tabular absolute right-1 bottom-1 rounded bg-black/70 px-1 text-[10px] font-medium text-white">{gen.score.overall}</span>
      )}
      <button
        type="button"
        aria-label={pickLabel}
        aria-pressed={picked}
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        className={cn(
          'absolute top-1 right-1 flex size-4 items-center justify-center rounded-full border border-white/80 bg-black/40 text-white transition-opacity',
          picked ? 'border-primary bg-primary text-primary-foreground opacity-100' : 'opacity-0 group-hover:opacity-100 [@media(pointer:coarse)]:opacity-100',
        )}
      >
        {picked && <Check className="size-3" />}
      </button>
    </div>
  );
}

export function Filmstrip() {
  const t = useT();
  const { generations, selectedId, pickedIds, jobs, select, togglePick, clearPicks, setView } = useWorkspace();
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const shown = favoritesOnly ? generations.filter((g) => g.favorite) : generations;
  const pending = jobs.filter((j) => j.status === 'running' && j.kind === 'generate').length;

  return (
    <div className="shrink-0 border-t bg-background">
      <div className="flex h-9 items-center gap-2 px-3 text-xs">
        <span className="font-medium text-muted-foreground">
          {t('filmstrip.title')} <span className="tabular">· {generations.length}</span>
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle size="sm" className="h-6 min-w-6 px-1" pressed={favoritesOnly} onPressedChange={setFavoritesOnly} aria-label={t('filmstrip.favoritesOnly')}>
              <Star className={cn('size-3.5', favoritesOnly && 'fill-amber-400 text-amber-400')} />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>{t('filmstrip.favoritesOnly')}</TooltipContent>
        </Tooltip>

        {pickedIds.length > 0 ? (
          <div className="ml-auto flex items-center gap-1">
            <Button size="xs" variant="secondary" onClick={() => setView('compare')} disabled={pickedIds.length < 2}>
              <Grid2x2 /> {t('canvas.viewCompare')} ({pickedIds.length})
            </Button>
            <Button
              size="xs"
              onClick={async () => {
                await exportTestCompare(pickedIds.map((id) => generations.find((g) => g.id === id)).filter((g): g is Generation => !!g));
                toast.success(t('filmstrip.exported'));
              }}
            >
              <Download /> {t('filmstrip.exportTestCompare', { n: Math.min(pickedIds.length, 3) })}
            </Button>
            <Button size="icon-xs" variant="ghost" onClick={clearPicks} aria-label={t('common.close')}>
              <X />
            </Button>
          </div>
        ) : (
          generations.length > 1 && <span className="ml-auto hidden text-muted-foreground lg:inline">{t('filmstrip.exportHint')} · Shift+clic</span>
        )}
      </div>
      <div className="flex h-[6.5rem] gap-2 overflow-x-auto px-3 pt-1 pb-3">
        {Array.from({ length: pending }).map((_, i) => (
          <div key={`p${i}`} className="aspect-video h-full shrink-0 animate-pulse rounded-md bg-muted" />
        ))}
        {shown.length === 0 && pending === 0 && (
          <p className="flex h-full items-center text-xs text-muted-foreground">{t('filmstrip.empty')}</p>
        )}
        {shown.map((g) => (
          <Tile
            key={g.id}
            gen={g}
            selected={g.id === selectedId}
            picked={pickedIds.includes(g.id)}
            onSelect={(e) => (e.shiftKey || e.metaKey || e.ctrlKey ? togglePick(g.id) : select(g.id))}
            onPick={() => togglePick(g.id)}
            pickLabel={t('filmstrip.selectForExport')}
          />
        ))}
      </div>
    </div>
  );
}
