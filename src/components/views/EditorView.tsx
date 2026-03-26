import { CheckCircle2, Circle, Eye, EyeOff, Palette, Pen, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { WorkspaceStrip } from '../WorkspaceStrip';
import { PreviewStage } from '../preview/PreviewStage';
import type { Dictionary } from '../../i18n/translations';
import type { ExifData, PreviewMode, StyleTemplate, WorkspaceImage, WorkspaceItem } from '../../types/app';

interface EditorViewProps {
  dict: Dictionary;
  sourceImage: WorkspaceImage;
  exifData: ExifData;
  workspaceItems: WorkspaceItem[];
  selectedImageId: string;
  previewMode: PreviewMode;
  selectedStyle: StyleTemplate;
  selectedStyleTitle: string;
  styleTemplates: StyleTemplate[];
  onSelectImage: (imageId: string) => void;
  onDeleteImage?: (imageId: string) => void | Promise<void>;
  deletingImageId?: string | null;
  onExifChange: <K extends keyof ExifData>(field: K, value: ExifData[K]) => void;
  onPreviewModeChange: (mode: PreviewMode) => void;
  onSelectStyle: (id: StyleTemplate['id']) => void;
  onApply: () => void;
}

export function EditorView({
  dict,
  sourceImage,
  exifData,
  workspaceItems,
  selectedImageId,
  previewMode,
  selectedStyle,
  selectedStyleTitle,
  styleTemplates,
  onSelectImage,
  onDeleteImage,
  deletingImageId = null,
  onExifChange,
  onPreviewModeChange,
  onSelectStyle,
  onApply,
}: EditorViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="mx-auto max-w-7xl px-4 pb-32 pt-24 md:px-12 lg:px-24"
    >
      <section className="mb-6">
        <WorkspaceStrip
          title={dict.imageQueueTitle}
          items={workspaceItems}
          selectedImageId={selectedImageId}
          onSelectImage={onSelectImage}
          onDeleteItem={onDeleteImage}
          deletingImageId={deletingImageId}
          deleteLabel={dict.deleteCloudPhoto}
        />
      </section>

      <section className="mb-12">
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest shadow-2xl">
          <PreviewStage
            image={sourceImage}
            exifData={exifData}
            styleTemplate={selectedStyle}
            styleTitle={selectedStyleTitle}
            brandName={dict.brandName}
            previewMode={previewMode}
            alt={sourceImage.name}
          />

          <div className="pointer-events-none absolute bottom-8 right-8 flex items-end gap-3">
            <div className="h-10 w-px bg-primary/20" />
            <div className="flex flex-col">
              <span className="font-headline text-[10px] uppercase tracking-[0.3em] text-primary/60">{dict.activeStyle}</span>
              <span className="font-headline text-sm font-bold tracking-widest text-primary">{selectedStyleTitle}</span>
            </div>
          </div>

          <div className="absolute left-6 top-6 flex items-center gap-2 rounded-full bg-surface/50 px-3 py-1.5 opacity-80 backdrop-blur-md">
            <div className="h-2 w-2 rounded-full bg-secondary" />
            <span className="font-sans text-[10px] font-medium uppercase tracking-[0.2em] text-primary">{exifData.focusMode}</span>
          </div>

          <div className="absolute right-6 top-6 rounded-full bg-surface/50 px-3 py-1.5 text-[10px] uppercase tracking-[0.2em] text-primary/80 backdrop-blur-md">
            {previewMode === 'processed' ? dict.processed : dict.original}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 px-2">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onPreviewModeChange('original')}
              className={`inline-flex items-center gap-2 text-xs font-headline uppercase tracking-widest transition-colors ${
                previewMode === 'original' ? 'font-bold text-secondary' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <EyeOff size={14} />
              {dict.original}
            </button>
            <button
              onClick={() => onPreviewModeChange('processed')}
              className={`inline-flex items-center gap-2 text-xs font-headline uppercase tracking-widest transition-colors ${
                previewMode === 'processed' ? 'font-bold text-secondary' : 'text-on-surface-variant hover:text-primary'
              }`}
            >
              <Eye size={14} />
              {dict.processed}
            </button>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-outline">{exifData.resolution}</span>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-surface-container-low p-8 ghost-border md:col-span-2">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-1 font-headline text-lg font-extrabold tracking-tight">{dict.exifTitle}</h2>
              <p className="font-sans text-xs text-on-surface-variant">{dict.exifDesc}</p>
            </div>
            <Sparkles className="text-secondary/40" size={32} strokeWidth={1} />
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">{dict.cameraBody}</label>
              <div className="relative">
                <input
                  type="text"
                  value={exifData.cameraBody}
                  onChange={(event) => onExifChange('cameraBody', event.target.value)}
                  className="w-full rounded-md border-none bg-surface-container-high px-4 py-3 text-sm font-headline tracking-wide text-primary outline-none focus:ring-1 focus:ring-secondary"
                />
                <Pen size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">{dict.lens}</label>
              <div className="relative">
                <input
                  type="text"
                  value={exifData.lens}
                  onChange={(event) => onExifChange('lens', event.target.value)}
                  className="w-full rounded-md border-none bg-surface-container-high px-4 py-3 text-sm font-headline tracking-wide text-primary outline-none focus:ring-1 focus:ring-secondary"
                />
                <Pen size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 sm:col-span-2">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">{dict.aperture}</label>
                <input
                  type="text"
                  value={exifData.aperture}
                  onChange={(event) => onExifChange('aperture', event.target.value)}
                  className="w-full rounded-md border-none bg-surface-container-high px-4 py-3 text-center text-sm font-headline tracking-wide text-primary outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">{dict.shutter}</label>
                <input
                  type="text"
                  value={exifData.shutter}
                  onChange={(event) => onExifChange('shutter', event.target.value)}
                  className="w-full rounded-md border-none bg-surface-container-high px-4 py-3 text-center text-sm font-headline tracking-wide text-primary outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-on-surface-variant">{dict.iso}</label>
                <input
                  type="text"
                  value={exifData.iso}
                  onChange={(event) => onExifChange('iso', event.target.value)}
                  className="w-full rounded-md border-none bg-surface-container-high px-4 py-3 text-center text-sm font-headline tracking-wide text-primary outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex-1 rounded-2xl bg-surface-container-high p-6 ghost-border">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">{dict.watermarkStyle}</h3>
              <Palette size={16} className="text-secondary/60" />
            </div>
            <div className="space-y-3">
              {styleTemplates.map((template) => {
                const isSelected = template.id === selectedStyle.id;
                return (
                  <button
                    key={template.id}
                    onClick={() => onSelectStyle(template.id)}
                    className={`w-full cursor-pointer rounded border p-3 text-left transition-all ${
                      isSelected
                        ? 'border-outline-variant/30 bg-surface-bright'
                        : 'border-transparent bg-surface-container-low hover:border-outline-variant/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className={`text-xs font-medium ${isSelected ? 'text-primary' : 'text-outline'}`}>{dict[template.titleKey]}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.15em] text-on-surface-variant">{dict[template.descriptionKey]}</div>
                      </div>
                      {isSelected ? (
                        <CheckCircle2 size={18} className="fill-secondary/20 text-secondary" />
                      ) : (
                        <Circle size={18} className="text-outline" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button onClick={onApply} className="w-full rounded-md bg-primary py-4 text-sm font-headline font-black uppercase tracking-[0.2em] text-surface shadow-lg transition-transform hover:bg-white active:scale-95">
            {dict.applyBtn}
          </button>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-4">
        {[
          { label: dict.colorSpace, value: exifData.colorSpace },
          { label: dict.bitDepth, value: exifData.bitDepth },
          { label: dict.metering, value: exifData.metering },
          { label: dict.fileSize, value: exifData.fileSize },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4">
            <span className="mb-1 block text-[9px] uppercase tracking-[0.2em] text-outline">{item.label}</span>
            <span className="text-xs font-mono text-secondary">{item.value}</span>
          </div>
        ))}
      </section>
    </motion.div>
  );
}
