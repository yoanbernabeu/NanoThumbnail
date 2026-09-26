import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Section } from '../Section';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { useSettings } from '../../stores/settings';
import { useT } from '../../i18n';
import type { AspectRatio, ModelId, OutputFormat, Resolution, SafetyLevel } from '../../lib/types';
import { cn } from '../../lib/utils';

const RATIOS: AspectRatio[] = ['16:9', '9:16', '4:3', '1:1'];
const RESOLUTIONS: Resolution[] = ['1K', '2K', '4K'];

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export function OutputSection() {
  const t = useT();
  const s = useSettings();
  const [advanced, setAdvanced] = useState(false);

  return (
    <Section title={t('brief.settings')}>
      <Select value={s.model} onValueChange={(v) => s.set({ model: v as ModelId })}>
        <SelectTrigger className="w-full" aria-label={t('brief.model')}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="nano-banana-pro">
            {t('brief.modelPro')} <span className="text-muted-foreground">· {t('brief.modelProHint')}</span>
          </SelectItem>
          <SelectItem value="nano-banana-2">
            {t('brief.model2')} <span className="text-muted-foreground">· {t('brief.model2Hint')}</span>
          </SelectItem>
        </SelectContent>
      </Select>

      <Row label={t('brief.ratio')}>
        <ToggleGroup type="single" size="sm" variant="outline" value={s.aspectRatio} onValueChange={(v) => v && s.set({ aspectRatio: v as AspectRatio })}>
          {RATIOS.map((r) => (
            <ToggleGroupItem key={r} value={r} className="tabular px-2 text-xs">
              {r}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Row>
      <Row label={t('brief.resolution')}>
        <ToggleGroup type="single" size="sm" variant="outline" value={s.resolution} onValueChange={(v) => v && s.set({ resolution: v as Resolution })}>
          {RESOLUTIONS.map((r) => (
            <ToggleGroupItem key={r} value={r} className="px-2.5 text-xs">
              {r}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Row>
      <Row label={t('brief.count')}>
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={String(s.count)}
          onValueChange={(v) => v && s.set({ count: Number(v) as 1 | 2 | 4 })}
        >
          {['1', '2', '4'].map((n) => (
            <ToggleGroupItem key={n} value={n} className="w-9 text-xs">
              ×{n}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Row>

      {s.provider === 'replicate' && (
      <button
        type="button"
        onClick={() => setAdvanced(!advanced)}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        aria-expanded={advanced}
      >
        <ChevronRight className={cn('size-3.5 transition-transform', advanced && 'rotate-90')} />
        {t('brief.advanced')}
      </button>
      )}
      {advanced && s.provider === 'replicate' && (
        <div className="space-y-2.5">
          {(
            <Row label={t('brief.fileFormat')}>
              <ToggleGroup type="single" size="sm" variant="outline" value={s.format} onValueChange={(v) => v && s.set({ format: v as OutputFormat })}>
                <ToggleGroupItem value="png" className="px-2.5 text-xs">PNG</ToggleGroupItem>
                <ToggleGroupItem value="jpg" className="px-2.5 text-xs">JPG</ToggleGroupItem>
              </ToggleGroup>
            </Row>
          )}
          {s.model === 'nano-banana-pro' && (
            <Row label={t('brief.safety')}>
              <Select value={s.safety} onValueChange={(v) => s.set({ safety: v as SafetyLevel })}>
                <SelectTrigger size="sm" className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="block_only_high">{t('brief.safetyPermissive')}</SelectItem>
                  <SelectItem value="block_medium_and_above">{t('brief.safetyMedium')}</SelectItem>
                  <SelectItem value="block_low_and_above">{t('brief.safetyStrict')}</SelectItem>
                </SelectContent>
              </Select>
            </Row>
          )}
        </div>
      )}
    </Section>
  );
}
