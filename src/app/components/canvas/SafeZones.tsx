import type { AspectRatio } from '../../lib/types';

/**
 * Areas YouTube covers or that get lost at small sizes:
 * - 16:9: duration badge (bottom-right), hover icons "watch later / queue"
 *   (top-right), progress bar (bottom edge); keep the message in the central 80%.
 * - 9:16 (Shorts): title and channel at the bottom, action buttons on the right.
 */
const hatch =
  'repeating-linear-gradient(135deg, rgb(255 60 90 / 0.35) 0 6px, rgb(255 60 90 / 0.12) 6px 12px)';

function Zone({ style, label }: { style: React.CSSProperties; label: string }) {
  return (
    <div className="absolute flex items-center justify-center rounded-sm border border-rose-400/70" style={{ background: hatch, ...style }}>
      <span className="rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">{label}</span>
    </div>
  );
}

export function SafeZones({ aspectRatio }: { aspectRatio: AspectRatio }) {
  if (aspectRatio === '9:16') {
    return (
      <div className="pointer-events-none absolute inset-0">
        <Zone style={{ left: '4%', right: '18%', bottom: '3%', height: '22%' }} label="Title · channel" />
        <Zone style={{ right: '2%', width: '14%', top: '38%', bottom: '8%' }} label="Actions" />
      </div>
    );
  }
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute inset-[10%] rounded-sm border border-dashed border-white/80 mix-blend-difference" />
      <Zone style={{ right: '1.5%', bottom: '3%', width: '13%', height: '11%' }} label="12:34" />
      <Zone style={{ right: '1.5%', top: '3%', width: '8%', height: '26%' }} label="⏱ ≡" />
      <div className="absolute inset-x-0 bottom-0 h-[2.5%] bg-red-600/70" />
    </div>
  );
}
