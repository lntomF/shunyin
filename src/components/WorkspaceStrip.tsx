import { Trash2 } from 'lucide-react';
import type { WorkspaceItem } from '../types/app';

interface WorkspaceStripProps {
  title: string;
  items: WorkspaceItem[];
  selectedImageId: string;
  onSelectImage: (imageId: string) => void;
  onDeleteItem?: (imageId: string) => void | Promise<void>;
  deletingImageId?: string | null;
  deleteLabel?: string;
}

export function WorkspaceStrip({
  title,
  items,
  selectedImageId,
  onSelectImage,
  onDeleteItem,
  deletingImageId = null,
  deleteLabel = 'Delete photo',
}: WorkspaceStripProps) {
  return (
    <section className="space-y-3 rounded-2xl bg-surface-container-low p-4 ghost-border">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-headline text-sm font-bold uppercase tracking-[0.22em] text-on-surface-variant">{title}</h3>
          <p className="mt-1 text-xs text-outline">{items.length}</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const isSelected = item.id === selectedImageId;
          return (
            <div
              key={item.id}
              className={`group relative w-[92px] shrink-0 overflow-hidden rounded-xl border text-left transition-all sm:w-[104px] md:w-[112px] ${
                isSelected
                  ? 'border-secondary/50 bg-surface-container-high'
                  : 'border-outline-variant/10 bg-surface-container-lowest hover:border-secondary/30'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectImage(item.id)}
                className="block w-full text-left"
              >
                <div className="aspect-[3/4] overflow-hidden bg-surface-container-low">
                  <img
                    src={item.image.objectUrl ?? item.image.src}
                    alt={item.image.name}
                    className={`h-full w-full object-cover shutter-transition ${isSelected ? 'scale-[1.02] opacity-100' : 'opacity-85 group-hover:scale-105 group-hover:opacity-100'}`}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="space-y-1 px-2 py-2">
                  <div className="truncate font-headline text-[11px] font-bold text-primary">{item.image.name}</div>
                  <div className="truncate text-[8px] uppercase tracking-[0.14em] text-on-surface-variant">{item.exifData.resolution}</div>
                </div>
              </button>
              {onDeleteItem && items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  disabled={deletingImageId === item.id}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-black/45 text-primary backdrop-blur-sm transition-colors hover:bg-black/65 disabled:cursor-wait disabled:opacity-60"
                  aria-label={deleteLabel}
                >
                  <Trash2 size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
