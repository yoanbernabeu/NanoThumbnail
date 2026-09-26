import { X } from 'lucide-react';
import { useBlobUrl } from '../hooks/use-blob-url';
import { cn } from '../lib/utils';

/** Small square image tile with an optional remove button and corner badge. */
export function Thumb({
  blob,
  onRemove,
  badge,
  className,
  alt = '',
  removeLabel,
}: {
  blob: Blob;
  onRemove?: () => void;
  badge?: string;
  className?: string;
  alt?: string;
  removeLabel?: string;
}) {
  const url = useBlobUrl(blob);
  return (
    <div className={cn('group relative aspect-square overflow-hidden rounded-md border bg-muted', className)}>
      <img src={url} alt={alt} className="size-full object-cover" loading="lazy" draggable={false} />
      {badge && (
        <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1 py-px text-[10px] font-medium text-white backdrop-blur-sm">
          {badge}
        </span>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          aria-label={removeLabel}
          className="absolute top-1 right-1 flex size-5 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
        >
          <X className="size-3" />
        </button>
      )}
    </div>
  );
}
