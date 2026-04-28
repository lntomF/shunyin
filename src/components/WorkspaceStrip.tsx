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
  orientation?: 'horizontal' | 'vertical';
}

export function WorkspaceStrip({
  title,
  items,
  selectedImageId,
  onSelectImage,
  onDeleteItem,
  deletingImageId = null,
  deleteLabel = 'Delete photo',
  orientation = 'horizontal',
}: WorkspaceStripProps) {
  const isVertical = orientation === 'vertical';

  return (
    <section className="console-panel relative overflow-hidden rounded-[1.35rem] p-3 sm:rounded-[1.75rem] sm:p-4">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/65 to-transparent" />
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-secondary">{title}</h3>
          <p className="mt-2 text-xs text-outline">{items.length}</p>
        </div>
      </div>

      <div className={isVertical ? 'flex gap-2 overflow-x-auto pb-1 xl:max-h-[calc(100vh-13rem)] xl:flex-col xl:overflow-y-auto xl:pb-0 xl:pr-1' : 'flex gap-2 overflow-x-auto pb-1'}>
        {items.map((item) => {
          const isSelected = item.id === selectedImageId;
          return (
            <div
              key={item.id}
              className={`group relative overflow-hidden rounded-[1.15rem] border text-left transition-all ${
                isVertical ? 'w-[92px] shrink-0 sm:w-[104px] md:w-[112px] xl:w-full' : 'w-[92px] shrink-0 sm:w-[104px] md:w-[112px]'
              } ${
                isSelected
                  ? 'border-secondary/40 bg-surface/85 shadow-sm'
                  : 'border-outline-variant/15 bg-surface-container-lowest/75 hover:border-secondary/25 hover:bg-surface/80'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectImage(item.id)}
                className={`block w-full text-left ${isVertical ? 'xl:flex xl:items-center xl:gap-3 xl:p-2' : ''}`}
              >
                <div className={`overflow-hidden bg-surface-container-low ${isVertical ? 'aspect-[3/4] xl:h-16 xl:w-12 xl:shrink-0 xl:rounded-[0.9rem] 2xl:h-20 2xl:w-16' : 'aspect-[3/4]'}`}>
                  <img
                    src={item.image.objectUrl ?? item.image.src}
                    alt={item.image.name}
                    className={`h-full w-full object-cover shutter-transition ${isSelected ? 'scale-[1.02] opacity-100' : 'opacity-85 group-hover:scale-105 group-hover:opacity-100'}`}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className={`space-y-1 ${isVertical ? 'px-2 py-2 xl:min-w-0 xl:flex-1 xl:py-0 xl:pl-0 xl:pr-7' : 'px-2 py-2'}`}>
                  <div className="truncate font-headline text-[11px] font-bold tracking-[0.04em] text-primary">{item.image.name}</div>
                  <div className="truncate font-mono text-[9px] uppercase tracking-[0.16em] text-on-surface-variant">{item.exifData.resolution}</div>
                </div>
              </button>
              {onDeleteItem && items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteItem(item.id)}
                  disabled={deletingImageId === item.id}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-high/80 text-primary backdrop-blur-sm transition-colors hover:border-secondary/25 hover:bg-surface-container-highest disabled:cursor-wait disabled:opacity-60"
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
