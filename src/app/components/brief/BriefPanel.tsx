import { Loader2, Plus, Sparkles, Square, Users, Wand2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Kbd } from '../ui/kbd';
import { ScrollArea } from '../ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { Field, Section } from '../Section';
import { ReferencesSection } from './ReferencesSection';
import { StylePicker } from './StylePicker';
import { OutputSection } from './OutputSection';
import { MOD } from '../TopBar';
import { useBlobUrl } from '../../hooks/use-blob-url';
import { MAX_PERSONAS, useWorkspace } from '../../stores/workspace';
import { useUI } from '../../stores/ui';
import { useT } from '../../i18n';
import type { Persona } from '../../lib/types';
import type { TextMode } from '../../lib/prompt';
import { cn } from '../../lib/utils';

function PersonaChip({ persona, active, onToggle }: { persona: Persona; active: boolean; onToggle: () => void }) {
  const front = persona.photos.find((p) => p.slot === 'front') ?? persona.photos[0];
  const url = useBlobUrl(front?.blob);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm transition-colors hover:bg-accent',
        active && 'border-primary bg-primary/10 text-foreground ring-1 ring-primary/40',
      )}
    >
      {url ? <img src={url} alt="" className="size-6 rounded-full object-cover" /> : <span className="size-6 rounded-full bg-muted" />}
      <span className="max-w-28 truncate">{persona.name}</span>
    </button>
  );
}

function PeopleSection() {
  const t = useT();
  const { personas, personaIds, togglePersona } = useWorkspace();
  const open = useUI((s) => s.open);
  return (
    <Section
      title={
        <span className="flex items-center gap-2">
          {t('brief.personas')}
          {personaIds.length > 0 && <span className="tabular font-normal">{personaIds.length}/{MAX_PERSONAS}</span>}
        </span>
      }
      action={
        <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => open('personas')}>
          <Users /> {t('brief.managePersonas')}
        </Button>
      }
    >
      {personas.length === 0 ? (
        <button
          type="button"
          onClick={() => open('personas')}
          className="flex w-full items-center gap-2 rounded-lg border border-dashed px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent/50"
        >
          <Plus className="size-4" /> {t('persona.new')}
        </button>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {personas.map((p) => (
            <PersonaChip key={p.id} persona={p} active={personaIds.includes(p.id)} onToggle={() => togglePersona(p.id)} />
          ))}
        </div>
      )}
    </Section>
  );
}

function BrandSection() {
  const t = useT();
  const { brand, saveBrand } = useWorkspace();
  const open = useUI((s) => s.open);
  const configured = !!(brand.styleProfile || brand.colors.length || brand.fontStyle || brand.logo);
  return (
    <Section
      title={t('brief.brand')}
      action={
        <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => open('brand')}>
          {configured ? t('brief.brandEdit') : t('brief.brandEmpty')}
        </Button>
      }
    >
      {configured && (
        <label className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-sm">
            <span className="flex -space-x-1">
              {brand.colors.slice(0, 4).map((c) => (
                <span key={c} className="size-4 rounded-full border-2 border-sidebar" style={{ background: c }} />
              ))}
            </span>
            <span className="truncate">{brand.channelName || t('brief.brandOn')}</span>
          </span>
          <Switch checked={brand.enabled} onCheckedChange={(enabled) => saveBrand({ ...brand, enabled })} aria-label={t('brief.brandOn')} />
        </label>
      )}
    </Section>
  );
}

export function BriefPanel({ onGenerated }: { onGenerated?: () => void }) {
  const t = useT();
  const { brief, setBrief, generate, jobs, cancelAll } = useWorkspace();
  const open = useUI((s) => s.open);
  const running = jobs.filter((j) => j.status === 'running' && j.kind === 'generate').length;

  return (
    <div className="flex h-full flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-6 p-4">
          <Section
            title={t('brief.title')}
            action={
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="xs" className="text-primary" onClick={() => open('assistant')}>
                    <Sparkles /> {t('brief.assistant')}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-60">{t('brief.assistantHint')}</TooltipContent>
              </Tooltip>
            }
          >
            <Field label={t('brief.videoTitle')} htmlFor="videoTitle">
              <Input
                id="videoTitle"
                value={brief.videoTitle}
                onChange={(e) => setBrief({ videoTitle: e.target.value })}
                placeholder={t('brief.videoTitlePlaceholder')}
              />
            </Field>
            <Field label={t('brief.brief')} htmlFor="brief">
              <Textarea
                id="brief"
                value={brief.brief}
                onChange={(e) => setBrief({ brief: e.target.value })}
                placeholder={t('brief.briefPlaceholder')}
                className="min-h-28 resize-y"
              />
            </Field>
            <Field
              label={t('brief.overlayText')}
              htmlFor="overlayText"
              hint={brief.overlayText.trim() ? (brief.textMode === 'space' ? t('brief.textSpaceHint') : undefined) : t('brief.overlayHint')}
            >
              <Input
                id="overlayText"
                value={brief.overlayText}
                onChange={(e) => setBrief({ overlayText: e.target.value })}
                placeholder={t('brief.overlayTextPlaceholder')}
              />
              {brief.overlayText.trim() && (
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  className="mt-2 w-full"
                  value={brief.textMode}
                  onValueChange={(v) => v && setBrief({ textMode: v as TextMode })}
                >
                  <ToggleGroupItem value="render" className="flex-1 text-xs">
                    {t('brief.textRender')}
                  </ToggleGroupItem>
                  <ToggleGroupItem value="space" className="flex-1 text-xs">
                    {t('brief.textSpace')}
                  </ToggleGroupItem>
                </ToggleGroup>
              )}
            </Field>
            <Field label={t('brief.style')}>
              <StylePicker />
            </Field>
          </Section>

          <PeopleSection />
          <ReferencesSection />
          <BrandSection />
          <OutputSection />
        </div>
      </ScrollArea>

      <div className="flex gap-2 border-t bg-sidebar p-3">
        <Button
          size="lg"
          className="flex-1 gap-2"
          onClick={() => {
            generate();
            onGenerated?.();
          }}
        >
          {running ? <Loader2 className="animate-spin" /> : <Wand2 />}
          {running ? t('brief.generating') : t('brief.generate')}
          <Kbd className="ml-1 hidden bg-primary-foreground/15 text-primary-foreground sm:inline-flex">{MOD} ↵</Kbd>
        </Button>
        {running > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon-lg" variant="outline" onClick={cancelAll} aria-label={t('brief.stop')}>
                <Square className="fill-current" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('brief.stop')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
