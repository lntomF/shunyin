import { CheckCircle2, Circle, Palette, Pen, Sparkles } from 'lucide-react';
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
    <div
      className="mx-auto min-h-[calc(100dvh-7rem)] w-full max-w-[1920px] px-3 pb-24 pt-20 sm:px-5 sm:pb-28 sm:pt-[5.5rem] lg:px-6 xl:px-8"
    >
      {/* 三列：图片队列 + EXIF | 预览 | 样式选择 */}
      <section className="grid min-h-[calc(100dvh-10rem)] grid-cols-1 gap-3 xl:grid-cols-[250px_minmax(0,1fr)_330px] xl:gap-4 2xl:grid-cols-[290px_minmax(0,1fr)_370px]">

        {/* 左栏：图片队列 + EXIF */}
        <aside className="space-y-2 xl:sticky xl:top-20 xl:self-start">
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
          <div className="flow-surface relative overflow-hidden rounded-2xl p-3 sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">{dict.exifTitle}</div>
              <Sparkles className="preview-glow text-secondary/55" size={14} strokeWidth={1} />
            </div>

            <div className="space-y-2.5">
              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{dict.cameraBody}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={exifData.cameraBody}
                    onChange={(event) => onExifChange('cameraBody', event.target.value)}
                    className="command-input w-full rounded-xl border border-secondary/10 px-3 py-2 text-xs font-headline tracking-[0.04em] text-primary outline-none shutter-transition focus:border-secondary/40 focus:shadow-[0_0_0_3px_rgba(139,223,255,0.08)]"
                  />
                  <Pen size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline" />
                </div>
              </div>

              {selectedStyle.styleType === 'magazine-cover' && (
                <div className="space-y-1">
                  <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{dict.coverTitle}</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={exifData.watermarkTitle ?? ''}
                      placeholder={dict.brandName}
                      onChange={(event) => onExifChange('watermarkTitle', event.target.value)}
                      className="command-input w-full rounded-xl border border-secondary/10 px-3 py-2 text-xs font-headline tracking-[0.04em] text-primary outline-none shutter-transition focus:border-secondary/40 focus:shadow-[0_0_0_3px_rgba(139,223,255,0.08)]"
                    />
                    <Pen size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline" />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[9px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">{dict.lens}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={exifData.lens}
                    onChange={(event) => onExifChange('lens', event.target.value)}
                    className="command-input w-full rounded-xl border border-secondary/10 px-3 py-2 text-xs font-headline tracking-[0.04em] text-primary outline-none shutter-transition focus:border-secondary/40 focus:shadow-[0_0_0_3px_rgba(139,223,255,0.08)]"
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
                      className="command-input w-full rounded-xl border border-secondary/10 px-2 py-2 text-center text-xs font-mono tracking-[0.04em] text-primary outline-none shutter-transition focus:border-secondary/40 focus:shadow-[0_0_0_3px_rgba(139,223,255,0.08)]"
                    />
                  </div>
                ))}
              </div>

              <div className="rail-divider border-t pt-2.5 space-y-1.5">
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
        <div className="min-h-0">
          <div className="stage-shell relative flex min-h-[32rem] items-center justify-center overflow-hidden rounded-2xl sm:min-h-[38rem] sm:rounded-3xl xl:h-[calc(100dvh-10rem)] xl:min-h-0">
            <div className="stage-vignette pointer-events-none absolute inset-0" />
            <div className="studio-grid pointer-events-none absolute inset-0 opacity-25" />
            <div className="preview-glow pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent" />
            <PreviewStage
              image={sourceImage}
              exifData={exifData}
              styleTemplate={selectedStyle}
              styleTitle={selectedStyleTitle}
              brandName={dict.brandName}
              previewMode={previewMode}
              alt={sourceImage.name}
              className="relative z-10 h-full w-auto"
            />
          </div>
        </div>

        {/* 右栏：样式选择 + 导出按钮 */}
        <aside className="space-y-2 xl:sticky xl:top-20 xl:self-start">
          <div className="flow-surface relative overflow-hidden rounded-2xl p-4 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">{dict.watermarkStyle}</div>
                <h3 className="mt-1.5 font-headline text-base font-bold tracking-[0] text-primary">{selectedStyleTitle}</h3>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-secondary/15 bg-surface/70 text-secondary shadow-[0_0_26px_rgba(139,223,255,0.12)]">
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
                    className={`w-full rounded-xl border p-2.5 text-left shutter-transition sm:p-3 ${
                      isSelected
                        ? 'border-secondary/24 bg-secondary/10'
                        : 'border-transparent bg-transparent hover:bg-white/5'
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
            className="studio-sheen w-full rounded-xl border border-secondary/20 bg-primary py-3 text-sm font-headline font-bold uppercase tracking-[0.16em] text-background shadow-[0_16px_42px_rgba(139,223,255,0.14)] shutter-transition hover:-translate-y-0.5 hover:opacity-95 active:scale-[0.99] sm:py-3.5"
          >
            {dict.applyBtn}
          </button>
        </aside>
      </section>
    </div>
  );
}
