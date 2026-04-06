import { CheckCircle2, Circle, Palette, Pen, Sparkles } from 'lucide-react';
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
  const metadataCards = [
    { label: dict.colorSpace, value: exifData.colorSpace },
    { label: dict.bitDepth, value: exifData.bitDepth },
    { label: dict.metering, value: exifData.metering },
    { label: dict.fileSize, value: exifData.fileSize },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="mx-auto max-w-[1600px] px-4 pb-32 pt-24 md:px-8 xl:px-12"
    >
      {/* 三列：图片队列 + EXIF | 预览 | 样式选择 */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[220px_minmax(0,1fr)_300px]">

        {/* 左栏：图片队列 + EXIF */}
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <WorkspaceStrip
            title={dict.imageQueueTitle}
            items={workspaceItems}
            selectedImageId={selectedImageId}
            onSelectImage={onSelectImage}
            onDeleteItem={onDeleteImage}
            deletingImageId={deletingImageId}
            deleteLabel={dict.deleteCloudPhoto}
            orientation="vertical"
          />

          {/* EXIF 紧凑面板 */}
          <div className="console-panel relative overflow-hidden rounded-[1.6rem] p-4">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">{dict.exifTitle}</div>
              <Sparkles className="text-secondary/40" size={14} strokeWidth={1} />
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{dict.cameraBody}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={exifData.cameraBody}
                    onChange={(event) => onExifChange('cameraBody', event.target.value)}
                    className="w-full rounded-[0.75rem] border border-secondary/10 bg-surface/70 px-3 py-2 text-xs font-headline tracking-[0.04em] text-primary outline-none shutter-transition focus:border-secondary/30"
                  />
                  <Pen size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{dict.lens}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={exifData.lens}
                    onChange={(event) => onExifChange('lens', event.target.value)}
                    className="w-full rounded-[0.75rem] border border-secondary/10 bg-surface/70 px-3 py-2 text-xs font-headline tracking-[0.04em] text-primary outline-none shutter-transition focus:border-secondary/30"
                  />
                  <Pen size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'aperture' as const, label: dict.aperture },
                  { key: 'shutter' as const, label: dict.shutter },
                  { key: 'iso' as const, label: dict.iso },
                ].map(({ key, label }) => (
                  <div key={key} className="space-y-1">
                    <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{label}</label>
                    <input
                      type="text"
                      value={exifData[key]}
                      onChange={(event) => onExifChange(key, event.target.value)}
                      className="w-full rounded-[0.75rem] border border-secondary/10 bg-surface/70 px-2 py-2 text-center text-xs font-mono tracking-[0.04em] text-primary outline-none shutter-transition focus:border-secondary/30"
                    />
                  </div>
                ))}
              </div>

              <div className="border-t border-outline-variant/10 pt-2.5 space-y-1.5">
                {metadataCards.map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">{item.label}</span>
                    <span className="font-mono text-[10px] text-secondary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* 中栏：预览 */}
        <div>
          <div className="flex items-center justify-center overflow-hidden rounded-[2rem] border border-secondary/12 bg-surface-container-lowest" style={{ height: '520px' }}>
            <PreviewStage
              image={sourceImage}
              exifData={exifData}
              styleTemplate={selectedStyle}
              styleTitle={selectedStyleTitle}
              brandName={dict.brandName}
              previewMode={previewMode}
              alt={sourceImage.name}
              className="h-full w-auto"
            />
          </div>
        </div>

        {/* 右栏：样式选择 + 导出按钮 */}
        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <div className="console-panel relative overflow-hidden rounded-[1.9rem] p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">{dict.watermarkStyle}</div>
                <h3 className="mt-1.5 font-headline text-base font-bold tracking-[-0.03em] text-primary">{selectedStyleTitle}</h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-[0.85rem] border border-secondary/15 bg-surface/70 text-secondary">
                <Palette size={15} />
              </div>
            </div>

            <div className="space-y-2">
              {styleTemplates.map((template) => {
                const isSelected = template.id === selectedStyle.id;
                return (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => onSelectStyle(template.id)}
                    className={`w-full rounded-[1rem] border p-3 text-left shutter-transition ${
                      isSelected
                        ? 'border-secondary/25 bg-secondary/10 shadow-[0_8px_20px_rgba(121,216,255,0.08)]'
                        : 'border-outline-variant/15 bg-surface/62 hover:border-secondary/20 hover:bg-surface/72'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className={`font-headline text-xs font-bold tracking-[0.03em] ${isSelected ? 'text-primary' : 'text-on-surface'}`}>
                        {dict[template.titleKey]}
                      </div>
                      {isSelected ? (
                        <CheckCircle2 size={15} className="shrink-0 fill-secondary/18 text-secondary" />
                      ) : (
                        <Circle size={15} className="shrink-0 text-outline" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={onApply}
            className="w-full rounded-[1.2rem] border border-secondary/20 bg-primary py-3.5 text-sm font-headline font-bold uppercase tracking-[0.2em] text-surface shadow-[0_14px_32px_rgba(121,216,255,0.18)] shutter-transition hover:bg-white active:scale-[0.99]"
          >
            {dict.applyBtn}
          </button>
        </aside>
      </section>
    </motion.div>
  );
}
