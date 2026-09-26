import { useState } from 'react';
import { ArrowUp, BarChart3, GitBranch, Loader2, Sparkles, SquareDashedMousePointer, Wand2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Section } from '../Section';
import { ScorePanel } from './ScorePanel';
import { useBlobUrl } from '../../hooks/use-blob-url';
import { lineage, selectedGeneration, useWorkspace } from '../../stores/workspace';
import { useT, type TKey } from '../../i18n';
import type { Generation } from '../../lib/types';
import { cn } from '../../lib/utils';

const QUICK_EDITS = ['emotion', 'contrast', 'background', 'zoom', 'text', 'noText'] as const;

function VersionRow({ gen, active, onClick }: { gen: Generation; active: boolean; onClick: () => void }) {
  const t = useT();
  const url = useBlobUrl(gen.blob);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('flex w-full items-center gap-3 rounded-md p-1.5 text-left transition-colors hover:bg-accent', active && 'bg-accent')}
    >
      <img src={url} alt="" className="aspect-video w-20 shrink-0 rounded object-cover ring-1 ring-border" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          {gen.kind === 'region' ? <SquareDashedMousePointer className="size-3" /> : gen.parentId ? <Wand2 className="size-3" /> : <Sparkles className="size-3" />}
          {gen.parentId ? t('iterate.edit') : t('iterate.original')}
        </span>
        <span className="line-clamp-2 text-xs">{gen.prompt}</span>
      </span>
    </button>
  );
}

function EditTab({ gen }: { gen: Generation }) {
  const t = useT();
  const { generations, select, edit, maskMode, hasMask, jobs } = useWorkspace();
  const [instruction, setInstruction] = useState('');
  const versions = lineage(generations, gen.id);
  const editing = jobs.some((j) => j.status === 'running' && j.parentId === gen.id);
  const region = maskMode && hasMask;

  const submit = (text = instruction) => {
    if (!text.trim()) return;
    edit(text);
    setInstruction('');
  };

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-4">
          {versions.length > 1 && (
            <Section title={<span className="flex items-center gap-1.5"><GitBranch className="size-3.5" /> {t('iterate.versions')}</span>}>
              <div className="space-y-0.5">
                {versions.map((v) => (
                  <VersionRow key={v.id} gen={v} active={v.id === gen.id} onClick={() => select(v.id)} />
                ))}
              </div>
            </Section>
          )}

          <Section title={t('iterate.quick')}>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_EDITS.map((key) => {
                const text = t(`iterate.quickEdits.${key}` as TKey);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={editing}
                    onClick={() => submit(text)}
                    className="rounded-full border px-2.5 py-1 text-left text-xs transition-colors hover:border-primary/50 hover:bg-accent disabled:opacity-50"
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </Section>
        </div>
      </ScrollArea>

      <div className="space-y-2 border-t p-3">
        {region && (
          <p className="flex items-center gap-1.5 rounded-md bg-primary/10 px-2 py-1.5 text-xs text-primary">
            <SquareDashedMousePointer className="size-3.5" /> {t('iterate.regionActive')}
          </p>
        )}
        <div className="relative">
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
                e.preventDefault();
                e.stopPropagation();
                submit();
              }
            }}
            placeholder={region ? t('iterate.regionPlaceholder') : t('iterate.editPlaceholder')}
            className="min-h-20 resize-none pr-11"
            aria-label={t('iterate.edit')}
          />
          <Button
            size="icon-sm"
            className="absolute right-2 bottom-2 rounded-full"
            onClick={() => submit()}
            disabled={!instruction.trim()}
            aria-label={t('iterate.send')}
          >
            {editing ? <Loader2 className="animate-spin" /> : <ArrowUp />}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function IteratePanel() {
  const t = useT();
  const gen = useWorkspace(selectedGeneration);
  const [tab, setTab] = useState('edit');

  if (!gen) {
    return <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">{t('iterate.noImage')}</div>;
  }

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex h-full flex-col gap-0">
      <div className="border-b px-3 py-2">
        <TabsList className="w-full">
          <TabsTrigger value="edit" className="gap-1.5">
            <Wand2 /> {t('iterate.edit')}
          </TabsTrigger>
          <TabsTrigger value="score" className="gap-1.5">
            <BarChart3 /> {t('iterate.score')}
            {gen.score && <span className="tabular text-xs text-muted-foreground">{gen.score.overall}</span>}
          </TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="edit" className="min-h-0 flex-1">
        <EditTab gen={gen} />
      </TabsContent>
      <TabsContent value="score" className="min-h-0 flex-1">
        <ScorePanel gen={gen} onApplyEdit={() => setTab('edit')} />
      </TabsContent>
    </Tabs>
  );
}
