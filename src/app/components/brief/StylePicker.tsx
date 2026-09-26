import { useState } from 'react';
import { Check, Palette } from 'lucide-react';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { STYLES, findStyle } from '../../lib/styles';
import { useWorkspace } from '../../stores/workspace';
import { useSettings } from '../../stores/settings';
import { useT } from '../../i18n';
import { cn } from '../../lib/utils';

export function StylePicker() {
  const t = useT();
  const lang = useSettings((s) => s.lang);
  const styleId = useWorkspace((s) => s.brief.styleId);
  const setBrief = useWorkspace((s) => s.setBrief);
  const current = findStyle(styleId);
  const [open, setOpen] = useState(false);

  const choose = (id: string) => {
    setBrief({ styleId: id });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start gap-2 font-normal">
          <Palette className="text-muted-foreground" />
          <span className="truncate">{current ? current.name[lang] : t('brief.styleNone')}</span>
          {current && <span className="ml-auto truncate text-xs text-muted-foreground">{current.hint[lang]}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={12} className="w-[min(34rem,calc(100vw-2rem))] p-2">
        <div className="grid max-h-[min(60vh,calc(var(--radix-popover-content-available-height)-1rem))] grid-cols-2 gap-1 overflow-y-auto">
          <StyleOption active={!current} title={t('brief.styleNone')} hint="—" onClick={() => choose('')} />
          {STYLES.map((s) => (
            <StyleOption key={s.id} active={s.id === styleId} title={s.name[lang]} hint={s.hint[lang]} onClick={() => choose(s.id)} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StyleOption({ active, title, hint, onClick }: { active: boolean; title: string; hint: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-start gap-2 rounded-md px-2.5 py-2 text-left transition-colors hover:bg-accent',
        active && 'bg-accent',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
      {active && <Check className="mt-0.5 size-4 text-primary" />}
    </button>
  );
}
