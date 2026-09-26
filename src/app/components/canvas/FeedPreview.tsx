import { useEffect, useMemo, useState } from 'react';
import { Loader2, Moon, Plus, Sun, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ToggleGroup, ToggleGroupItem } from '../ui/toggle-group';
import { useBlobUrl } from '../../hooks/use-blob-url';
import { blobUrl, useWorkspace } from '../../stores/workspace';
import { extractVideoId, fetchVideoTitle } from '../../lib/youtube';
import { useT } from '../../i18n';
import type { Generation } from '../../lib/types';
import { cn } from '../../lib/utils';

type FeedMode = 'home' | 'search' | 'sidebar' | 'mobile' | 'tv';

interface Card {
  id: string;
  src?: string;
  title: string;
  channel: string;
  mine?: boolean;
  duration: string;
}

interface Competitor {
  id: string;
  title: string;
}

const COMPETITORS_KEY = 'nt_competitors';
const FAKE_DURATIONS = ['12:34', '8:07', '21:45', '15:02', '4:59', '32:10', '9:41'];

function loadCompetitors(): Competitor[] {
  try {
    return JSON.parse(localStorage.getItem(COMPETITORS_KEY) || '[]');
  } catch {
    return [];
  }
}

/** YouTube feed palette, independent from the app theme. */
function palette(dark: boolean) {
  return dark
    ? { bg: '#0f0f0f', fg: '#f1f1f1', muted: '#aaaaaa', placeholder: '#272727' }
    : { bg: '#ffffff', fg: '#0f0f0f', muted: '#606060', placeholder: '#e5e5e5' };
}

function Thumbnail({ card, className, dark }: { card: Card; className?: string; dark: boolean }) {
  const colors = palette(dark);
  return (
    <div className={cn('relative aspect-video w-full overflow-hidden rounded-xl', className)} style={{ background: colors.placeholder }}>
      {card.src && <img src={card.src} alt="" className="size-full object-cover" draggable={false} />}
      <span className="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1 py-px text-[11px] leading-4 font-medium text-white">
        {card.duration}
      </span>
      {card.mine && <span className="absolute inset-0 rounded-xl ring-2 ring-primary ring-offset-0" />}
    </div>
  );
}

function Meta({ card, dark, size = 'md', avatar = true }: { card: Card; dark: boolean; size?: 'sm' | 'md' | 'lg'; avatar?: boolean }) {
  const t = useT();
  const colors = palette(dark);
  const titleSize = size === 'sm' ? 'text-[13px] leading-[18px]' : size === 'lg' ? 'text-lg leading-6' : 'text-[15px] leading-[21px]';
  if (!card.title) {
    // Neutral skeleton for filler slots: realistic density without fake content
    return (
      <div className="flex gap-3 pt-2.5">
        {avatar && <span className="size-9 shrink-0 rounded-full" style={{ background: colors.placeholder }} />}
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-3 w-11/12 rounded" style={{ background: colors.placeholder }} />
          <div className="h-3 w-2/3 rounded" style={{ background: colors.placeholder }} />
          <div className="h-2.5 w-1/3 rounded" style={{ background: colors.placeholder }} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 pt-2.5">
      {avatar && <span className="size-9 shrink-0 rounded-full" style={{ background: card.mine ? 'var(--primary)' : colors.placeholder }} />}
      <div className="min-w-0">
        <p className={cn('line-clamp-2 font-medium', titleSize)} style={{ color: colors.fg }}>
          {card.title}
        </p>
        <p className="mt-0.5 text-xs" style={{ color: colors.muted }}>
          {card.channel}
        </p>
        <p className="text-xs" style={{ color: colors.muted }}>
          {t('feed.views', { n: card.mine ? '—' : '1,2 M' })} · {t('feed.ago')}
        </p>
      </div>
    </div>
  );
}

function CompetitorsEditor({ competitors, onChange }: { competitors: Competitor[]; onChange: (c: Competitor[]) => void }) {
  const t = useT();
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);

  async function add() {
    const id = extractVideoId(url);
    if (!id) return void toast.error(t('brief.youtubeError'));
    setBusy(true);
    const title = (await fetchVideoTitle(id)) ?? 'YouTube';
    onChange([...competitors.filter((c) => c.id !== id), { id, title }].slice(-11));
    setUrl('');
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">{t('feed.competitors')}</p>
        <p className="text-xs text-muted-foreground">{t('feed.competitorsHint')}</p>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t('brief.youtubePlaceholder')} className="h-8" />
        <Button size="sm" type="submit" disabled={busy || !url.trim()}>
          {busy ? <Loader2 className="animate-spin" /> : t('feed.addCompetitor')}
        </Button>
      </form>
      <ul className="max-h-48 space-y-1 overflow-y-auto">
        {competitors.map((c) => (
          <li key={c.id} className="flex items-center gap-2 text-xs">
            <img src={`https://i.ytimg.com/vi/${c.id}/default.jpg`} alt="" className="h-6 w-10 rounded object-cover" />
            <span className="min-w-0 flex-1 truncate">{c.title}</span>
            <Button variant="ghost" size="icon-xs" onClick={() => onChange(competitors.filter((x) => x.id !== c.id))} aria-label={t('common.remove')}>
              <X />
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FeedPreview({ generation }: { generation: Generation }) {
  const t = useT();
  const [mode, setMode] = useState<FeedMode>('home');
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [competitors, setCompetitors] = useState<Competitor[]>(loadCompetitors);
  const { generations, brief, brand } = useWorkspace();
  const mineSrc = useBlobUrl(generation.blob);

  useEffect(() => {
    try {
      localStorage.setItem(COMPETITORS_KEY, JSON.stringify(competitors));
    } catch {
      /* ignore */
    }
  }, [competitors]);

  const cards = useMemo<Card[]>(() => {
    const channel = brand.channelName || t('feed.channel');
    const mine: Card = {
      id: 'mine',
      src: mineSrc,
      title: generation.videoTitle || brief.videoTitle || t('feed.noTitle'),
      channel,
      mine: true,
      duration: '12:34',
    };
    const others: Card[] = competitors.map((c, i) => ({
      id: c.id,
      src: `https://i.ytimg.com/vi/${c.id}/mqdefault.jpg`,
      title: c.title,
      channel: 'YouTube',
      duration: FAKE_DURATIONS[i % FAKE_DURATIONS.length],
    }));
    // Fill with the project's other images so the feed never looks empty
    const fillers: Card[] = generations
      .filter((g) => g.id !== generation.id)
      .slice(0, 11 - others.length)
      .map((g, i) => ({
        id: g.id,
        src: blobUrl(g.blob),
        title: g.videoTitle || g.prompt.slice(0, 80),
        channel,
        duration: FAKE_DURATIONS[(i + 3) % FAKE_DURATIONS.length],
      }));
    const pool = [...others, ...fillers];
    while (pool.length < 8) pool.push({ id: `ph${pool.length}`, title: '', channel: '', duration: '10:00' });
    // Put ours in a realistic, non-first position
    return [...pool.slice(0, 1), mine, ...pool.slice(1, 11)];
  }, [competitors, generations, generation, mineSrc, brief.videoTitle, brand.channelName, t]);

  const colors = palette(dark);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2">
        <ToggleGroup type="single" size="sm" variant="outline" value={mode} onValueChange={(v) => v && setMode(v as FeedMode)}>
          {(['home', 'search', 'sidebar', 'mobile', 'tv'] as const).map((m) => (
            <ToggleGroupItem key={m} value={m} className="px-2.5 text-xs">
              {t(`feed.${m}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="ghost" size="icon-sm" onClick={() => setDark(!dark)} aria-label={t('feed.darkFeed')} aria-pressed={dark}>
          {dark ? <Moon /> : <Sun />}
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="ml-auto gap-1.5">
              <Plus /> {t('feed.competitors')}
              {competitors.length > 0 && <span className="tabular text-muted-foreground">{competitors.length}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96">
            <CompetitorsEditor competitors={competitors} onChange={setCompetitors} />
          </PopoverContent>
        </Popover>
      </div>

      <div className="min-h-0 flex-1 overflow-auto" style={{ background: colors.bg, fontFamily: 'Roboto, Arial, sans-serif' }}>
        {mode === 'home' && (
          <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-x-4 gap-y-8 p-6">
            {cards.slice(0, 9).map((c) => (
              <div key={c.id}>
                <Thumbnail card={c} dark={dark} />
                <Meta card={c} dark={dark} />
              </div>
            ))}
          </div>
        )}

        {mode === 'search' && (
          <div className="mx-auto max-w-[1100px] space-y-4 p-6">
            {cards.slice(0, 5).map((c) => (
              <div key={c.id} className="flex gap-4">
                <Thumbnail card={c} dark={dark} className="w-[360px] shrink-0" />
                <div className="-mt-2 min-w-0"><Meta card={c} dark={dark} size="lg" avatar={false} /></div>
              </div>
            ))}
          </div>
        )}

        {mode === 'sidebar' && (
          <div className="flex gap-6 p-6">
            <div className="hidden flex-1 lg:block">
              <div className="aspect-video w-full rounded-xl" style={{ background: colors.placeholder }} />
            </div>
            <div className="w-[402px] shrink-0 space-y-2">
              {cards.slice(0, 8).map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Thumbnail card={c} dark={dark} className="w-[168px] shrink-0 rounded-lg" />
                  <div className="-mt-2.5 min-w-0"><Meta card={c} dark={dark} size="sm" avatar={false} /></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode === 'mobile' && (
          <div className="flex justify-center py-6">
            <div className="w-[375px] overflow-hidden rounded-[2.5rem] border-[10px] border-neutral-900 shadow-2xl" style={{ background: colors.bg }}>
              <div className="h-[720px] space-y-4 overflow-y-auto pb-6">
                {cards.slice(0, 5).map((c) => (
                  <div key={c.id}>
                    <Thumbnail card={c} dark={dark} className="rounded-none" />
                    <div className="px-3"><Meta card={c} dark={dark} size="sm" /></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {mode === 'tv' && (
          <div className="min-h-full p-10" style={{ background: '#0f0f0f' }}>
            <div className="grid grid-cols-4 gap-5">
              {cards.slice(0, 8).map((c) => (
                <div key={c.id} className={cn('rounded-xl transition-transform', c.mine && 'scale-105')}>
                  <Thumbnail card={c} dark className={cn(c.mine && 'ring-4 ring-white')} />
                  {c.title && <p className="mt-2 line-clamp-1 text-sm text-white/90">{c.title}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
