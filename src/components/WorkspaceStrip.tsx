import type { WorkspaceItem } from '../types/app';

interface WorkspaceStripProps {
  title: string;
  items: WorkspaceItem[];
  selectedImageId: string;
  onSelectImage: (imageId: string) => void;
}

export function WorkspaceStrip({ title, items, selectedImageId, onSelectImage }: WorkspaceStripProps) {
  return (
    <section className="space-y-4 rounded-2xl bg-surface-container-low p-5 ghost-border">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-headline text-sm font-bold uppercase tracking-[0.22em] text-on-surface-variant">{title}</h3>
          <p className="mt-1 text-xs text-outline">{items.length}</p>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {items.map((item) => {
          const isSelected = item.id === selectedImageId;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectImage(item.id)}
              className={`group min-w-[156px] overflow-hidden rounded-2xl border text-left transition-all ${
                isSelected
                  ? 'border-secondary/50 bg-surface-container-high'
                  : 'border-outline-variant/10 bg-surface-container-lowest hover:border-secondary/30'
              }`}
            >
              <div className="aspect-[4/5] overflow-hidden bg-surface-container-low">
                <img
                  src={item.image.objectUrl ?? item.image.src}
                  alt={item.image.name}
                  className={`h-full w-full object-cover shutter-transition ${isSelected ? 'scale-[1.02] opacity-100' : 'opacity-85 group-hover:scale-105 group-hover:opacity-100'}`}
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 px-3 py-3">
                <div className="truncate font-headline text-sm font-bold text-primary">{item.image.name}</div>
                <div className="truncate text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">{item.exifData.resolution}</div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
