import { useState } from 'react';
import {
  Brush,
  Copy,
  Download,
  Eraser,
  Grid2x2,
  ImageIcon,
  ImagePlus,
  Library,
  Loader2,
  MoreHorizontal,
  RotateCcw,
  ScanLine,
  Star,
  Trash2,
  Tv,
  X,
  SquarePlay,
  AlertCircle,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { Toggle } from '../ui/toggle';
import { Kbd } from '../ui/kbd';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { SafeZones } from './SafeZones';
import { MaskLayer, type MaskTool } from './MaskLayer';
import { FeedPreview } from './FeedPreview';
import { CompareView } from './CompareView';
import { MOD } from '../TopBar';
import { useBlobUrl } from '../../hooks/use-blob-url';
import { fit, useElementSize } from '../../hooks/use-element-size';
import { selectedGeneration, useWorkspace, type Job, type ViewMode } from '../../stores/workspace';
import { downloadForYouTube } from '../../lib/exporting';
import { downloadBlob, extensionFor } from '../../lib/images';
import { useT } from '../../i18n';
import type { Generation } from '../../lib/types';
import { cn } from '../../lib/utils';

function IconTip({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function JobChip({ job }: { job: Job }) {
  const t = useT();
  const { cancelJob, dismissJob } = useWorkspace();
  const failed = job.status === 'failed';
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full border bg-card/95 py-1 pr-1 pl-3 text-xs shadow-sm backdrop-blur',
        failed && 'border-destructive/40 text-destructive',
      )}
    >
      {failed ? <AlertCircle className="size-3.5" /> : <Loader2 className="size-3.5 animate-spin text-primary" />}
      <span className="max-w-64 truncate">
        {failed ? job.error || t('canvas.failed') : `${job.kind === 'generate' ? t('brief.generating') : t('iterate.edit')} ${t('common.seconds', { n: Math.round(job.elapsed / 1000) })}`}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        className="rounded-full"
        onClick={() => (failed ? dismissJob(job.id) : cancelJob(job.id))}
        aria-label={failed ? t('common.close') : t('common.cancel')}
      >
        <X />
      </Button>
    </div>
  );
}

function EmptyState({ running }: { running: number }) {
  const t = useT();
  if (running) {
    return (
      <div className="grid w-full max-w-3xl grid-cols-2 gap-3 p-6">
        {Array.from({ length: running }).map((_, i) => (
          <div key={i} className="aspect-video animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-3 p-8 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border bg-card">
        <ImageIcon className="size-5 text-muted-foreground" />
      </div>
      <p className="font-medium">{t('canvas.empty')}</p>
      <p className="text-sm text-muted-foreground">
        {t('canvas.emptyHint', { shortcut: `${MOD} ↵` })}
      </p>
    </div>
  );
}

function ImageView({ gen, tool, brushSize, clearSignal }: { gen: Generation; tool: MaskTool; brushSize: number; clearSignal: number }) {
  const url = useBlobUrl(gen.blob);
  const { safeZones, maskMode } = useWorkspace();
  const [ref, box] = useElementSize<HTMLDivElement>();
  const size = fit(gen.width / gen.height, { width: box.width - 48, height: box.height - 48 });

  return (
    <div ref={ref} className="flex size-full items-center justify-center">
      {size.width > 0 && (
        <div className="relative overflow-hidden rounded-lg shadow-lg ring-1 ring-border" style={size}>
          <img src={url} alt={gen.prompt} className="size-full select-none" draggable={false} />
          {safeZones && <SafeZones aspectRatio={gen.params.aspectRatio} />}
          {maskMode && <MaskLayer width={gen.width} height={gen.height} tool={tool} brushSize={brushSize} clearSignal={clearSignal} />}
        </div>
      )}
    </div>
  );
}

function ImageActions({ gen }: { gen: Generation }) {
  const t = useT();
  const { toggleFavorite, removeGeneration, addRef, saveToLibrary, reuse } = useWorkspace();
  return (
    <>
      <IconTip label={gen.favorite ? t('canvas.unfavorite') : t('canvas.favorite')}>
        <Button variant="ghost" size="icon-sm" onClick={() => toggleFavorite(gen.id)} aria-pressed={!!gen.favorite}>
          <Star className={cn(gen.favorite && 'fill-amber-400 text-amber-400')} />
        </Button>
      </IconTip>
      <IconTip label={t('canvas.exportYouTube')}>
        <Button variant="ghost" size="icon-sm" onClick={() => downloadForYouTube(gen)}>
          <SquarePlay />
        </Button>
      </IconTip>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label="More">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onSelect={() => downloadBlob(gen.blob, `nanothumbnail-${gen.id.slice(2, 10)}.${extensionFor(gen.blob)}`)}>
            <Download /> {t('canvas.download')} ({gen.width}×{gen.height})
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => downloadForYouTube(gen)}>
            <SquarePlay /> {t('canvas.exportYouTube')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => addRef(gen.blob, 'history')}>
            <ImagePlus /> {t('canvas.useAsRef')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => saveToLibrary(gen.blob)}>
            <Library /> {t('canvas.saveToLibrary')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => reuse(gen)}>
            <RotateCcw /> {t('canvas.reuse')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={async () => {
              await navigator.clipboard.writeText(gen.fullPrompt);
              toast.success(t('common.copied'));
            }}
          >
            <Copy /> {t('canvas.copyPrompt')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => removeGeneration(gen.id)}>
            <Trash2 /> {t('canvas.deleteImage')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

export function CanvasArea() {
  const t = useT();
  const ws = useWorkspace();
  const gen = useWorkspace(selectedGeneration);
  const [tool, setTool] = useState<MaskTool>('brush');
  const [brushSize, setBrushSize] = useState(0.05);
  const [clearSignal, setClearSignal] = useState(0);
  const running = ws.jobs.filter((j) => j.status === 'running' && j.kind === 'generate').length;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-canvas">
      {/* Toolbar */}
      <div className="flex h-11 shrink-0 items-center gap-1 border-b bg-background px-2">
        <ToggleGroup type="single" size="sm" value={ws.view} onValueChange={(v) => v && ws.setView(v as ViewMode)}>
          <ToggleGroupItem value="image" className="gap-1.5 px-2.5 text-xs">
            <ImageIcon /> <span className="hidden sm:inline">{t('canvas.viewImage')}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="feed" className="gap-1.5 px-2.5 text-xs" disabled={!gen}>
            <Tv /> <span className="hidden sm:inline">{t('canvas.viewFeed')}</span>
          </ToggleGroupItem>
          <ToggleGroupItem value="compare" className="gap-1.5 px-2.5 text-xs">
            <Grid2x2 /> <span className="hidden sm:inline">{t('canvas.viewCompare')}</span>
            {ws.pickedIds.length > 0 && <span className="tabular text-muted-foreground">{ws.pickedIds.length}</span>}
          </ToggleGroupItem>
        </ToggleGroup>

        {ws.view === 'image' && gen && (
          <>
            <span className="mx-1 h-5 w-px bg-border" />
            <IconTip label={`${t('canvas.safeZones')} (Z)`}>
              <Toggle size="sm" pressed={ws.safeZones} onPressedChange={ws.setSafeZones} aria-label={t('canvas.safeZones')}>
                <ScanLine />
              </Toggle>
            </IconTip>
            <IconTip label={`${t('canvas.maskTool')} (M)`}>
              <Toggle size="sm" pressed={ws.maskMode} onPressedChange={ws.setMaskMode} aria-label={t('canvas.maskTool')}>
                <Wand2 />
              </Toggle>
            </IconTip>
            {ws.maskMode && (
              <div className="flex items-center gap-1 rounded-md bg-accent/60 px-1">
                <ToggleGroup type="single" size="sm" value={tool} onValueChange={(v) => v && setTool(v as MaskTool)}>
                  <ToggleGroupItem value="brush" aria-label={t('canvas.brush')}>
                    <Brush />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="eraser" aria-label={t('canvas.eraser')}>
                    <Eraser />
                  </ToggleGroupItem>
                </ToggleGroup>
                <Slider
                  className="w-24"
                  min={0.01}
                  max={0.15}
                  step={0.005}
                  value={[brushSize]}
                  onValueChange={([v]) => setBrushSize(v)}
                  aria-label={t('canvas.brush')}
                />
                <Button variant="ghost" size="xs" onClick={() => setClearSignal((n) => n + 1)}>
                  {t('canvas.clearMask')}
                </Button>
              </div>
            )}
          </>
        )}

        {gen && ws.view !== 'compare' && (
          <div className="ml-auto flex items-center">
            <ImageActions gen={gen} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="relative min-h-0 flex-1">
        {ws.view === 'compare' ? (
          <CompareView />
        ) : ws.view === 'feed' && gen ? (
          <FeedPreview generation={gen} />
        ) : gen ? (
          <ImageView gen={gen} tool={tool} brushSize={brushSize} clearSignal={clearSignal} />
        ) : (
          <div className="flex size-full items-center justify-center">
            <EmptyState running={running} />
          </div>
        )}

        {ws.maskMode && ws.view === 'image' && (
          <p className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-1 text-xs text-background shadow">
            {t('canvas.maskHint')} <Kbd className="ml-1">Esc</Kbd>
          </p>
        )}

        {ws.jobs.length > 0 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 flex-col items-center gap-1.5">
            {ws.jobs.map((j) => (
              <JobChip key={j.id} job={j} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
