import { ArrowRight, Download, LoaderCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { WorkspaceStrip } from '../WorkspaceStrip';
import { PreviewStage } from '../preview/PreviewStage';
import type { Dictionary } from '../../i18n/translations';
import type { ExifData, ExportHistoryItem, ExportSettings, ExportStatus, PreviewMode, StyleTemplate, WorkspaceImage, WorkspaceItem, WorkspaceNotice } from '../../types/app';

interface ExportViewProps {
  dict: Dictionary;
  sourceImage: WorkspaceImage;
  exifData: ExifData;
  workspaceItems: WorkspaceItem[];
  selectedImageId: string;
  exportHistory: ExportHistoryItem[];
  exportSettings: ExportSettings;
  exportStatus: ExportStatus;
  notice: WorkspaceNotice;
  previewMode: PreviewMode;
  selectedStyle: StyleTemplate;
  selectedStyleTitle: string;
  onSelectImage: (imageId: string) => void;
  onDeleteImage?: (imageId: string) => void | Promise<void>;
  deletingImageId?: string | null;
  onExportSettingsChange: <K extends keyof ExportSettings>(field: K, value: ExportSettings[K]) => void;
  onExportCurrent: () => void | Promise<void>;
  onExportAll: () => void | Promise<void>;
}

export function ExportView({
  dict,
  sourceImage,
  exifData,
  workspaceItems,
  selectedImageId,
  exportSettings,
  exportStatus,
  notice,
  previewMode,
  selectedStyle,
  selectedStyleTitle,
  onSelectImage,
  onDeleteImage,
  deletingImageId = null,
  onExportSettingsChange,
  onExportCurrent,
  onExportAll,
}: ExportViewProps) {
  const hasMultiple = workspaceItems.length > 1;
  const statusMessage = notice === 'export_failed'
    ? dict.exportFailed
    : exportStatus === 'rendering'
      ? dict.exportRendering
      : notice === 'export_done'
        ? dict.exportCompleted
        : dict.exportReady;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      className="mx-auto min-h-[calc(100dvh-7rem)] w-full max-w-[1920px] px-3 pb-24 pt-20 sm:px-5 sm:pb-28 sm:pt-[5.5rem] lg:px-6 xl:px-8"
    >
      <section className="grid min-h-[calc(100dvh-10rem)] grid-cols-1 gap-4 xl:grid-cols-[240px_minmax(0,1fr)_320px] 2xl:grid-cols-[280px_minmax(0,1fr)_360px]">

        {/* 左栏：图片队列竖排 */}
        <aside className="xl:sticky xl:top-20 xl:self-start">
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
        </aside>

        {/* 中栏：预览 */}
        <div className="min-h-0 space-y-4">
          <div className="flex min-h-[30rem] items-center justify-center overflow-hidden rounded-[1.4rem] border border-secondary/12 bg-surface-container-lowest sm:min-h-[36rem] sm:rounded-[2rem] xl:h-[calc(100dvh-17rem)] xl:min-h-0">
            <PreviewStage
              image={sourceImage}
              exifData={exifData}
              styleTemplate={selectedStyle}
              styleTitle={selectedStyleTitle}
              brandName={dict.brandName}
              previewMode={previewMode === 'original' ? 'processed' : previewMode}
              alt={sourceImage.name}
              className="h-full w-auto"
            />
          </div>

          {/* 文件信息条 */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
            <div className="console-panel rounded-[1rem] p-3 sm:rounded-[1.2rem] sm:p-4">
              <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-secondary">{dict.fileNameLabel}</div>
              <div className="font-mono text-sm text-primary">{exportSettings.fileName}.{exportSettings.format.toLowerCase()}</div>
            </div>
            <div className="console-panel rounded-[1rem] p-3 sm:rounded-[1.2rem] sm:p-4">
              <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-secondary">{dict.selectedStyle}</div>
              <div className="font-mono text-sm text-primary">{selectedStyleTitle}</div>
            </div>
            <div className="console-panel rounded-[1rem] p-3 sm:rounded-[1.2rem] sm:p-4">
              <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.25em] text-secondary">{dict.statusLabel}</div>
              <div className="font-mono text-sm text-primary">{statusMessage}</div>
            </div>
          </div>
        </div>

        {/* 右栏：导出设置 + 按钮 */}
        <aside className="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <div className="console-panel relative overflow-hidden rounded-[1.35rem] p-4 sm:rounded-[1.6rem] sm:p-5">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />
            <div className="mb-4 text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">{dict.exportTitle}</div>

            <div className="space-y-3">
              <label className="block space-y-1.5">
                <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">{dict.fileNameLabel}</span>
                <input
                  type="text"
                  value={exportSettings.fileName}
                  onChange={(event) => onExportSettingsChange('fileName', event.target.value)}
                  className="w-full rounded-[0.75rem] border border-secondary/10 bg-surface/70 px-3 py-2 text-xs text-primary outline-none shutter-transition focus:border-secondary/30"
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <label className="block space-y-1.5">
                  <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">{dict.formatLabel}</span>
                  <select
                    value={exportSettings.format}
                    onChange={(event) => onExportSettingsChange('format', event.target.value as ExportSettings['format'])}
                    className="w-full rounded-[0.75rem] border border-secondary/10 bg-surface/70 px-3 py-2 text-xs text-primary outline-none shutter-transition focus:border-secondary/30"
                  >
                    <option value="JPG">JPG</option>
                    <option value="PNG">PNG</option>
                  </select>
                </label>

                <label className="block space-y-1.5">
                  <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">{dict.qualityLabel}</span>
                  <select
                    value={exportSettings.quality}
                    onChange={(event) => onExportSettingsChange('quality', event.target.value as ExportSettings['quality'])}
                    className="w-full rounded-[0.75rem] border border-secondary/10 bg-surface/70 px-3 py-2 text-xs text-primary outline-none shutter-transition focus:border-secondary/30"
                  >
                    <option value="web">{dict.qualityWeb}</option>
                    <option value="standard">{dict.qualityStandard}</option>
                    <option value="max">{dict.qualityMax}</option>
                  </select>
                </label>
              </div>

              <div className="border-t border-outline-variant/10 pt-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">{dict.totalImagesLabel}</span>
                  <span className="font-mono text-[10px] text-secondary">{workspaceItems.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-on-surface-variant">{dict.metadataLabel}</span>
                  <span className="font-mono text-[10px] text-secondary">{exifData.cameraBody}</span>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={onExportAll}
            disabled={exportStatus === 'rendering'}
            className="inline-flex w-full items-center justify-center gap-2 rounded-[1.05rem] border border-secondary/25 bg-primary px-5 py-3 text-sm font-headline font-bold uppercase tracking-[0.16em] text-surface shadow-md shutter-transition hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 sm:rounded-[1.2rem] sm:py-3.5"
          >
            {exportStatus === 'rendering' ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}
            {hasMultiple ? `${dict.exportAllLabel} (${workspaceItems.length})` : dict.exportNow}
          </button>

          {hasMultiple && (
            <button
              onClick={onExportCurrent}
              disabled={exportStatus === 'rendering'}
              className="console-panel inline-flex w-full items-center justify-center gap-2 rounded-[1.05rem] px-5 py-3 text-sm font-headline font-bold uppercase tracking-[0.16em] text-primary shutter-transition hover:-translate-y-0.5 hover:border-secondary/35 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60 sm:rounded-[1.2rem] sm:py-3.5"
            >
              {exportStatus === 'rendering' ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
              {dict.exportCurrentLabel}
            </button>
          )}
        </aside>
      </section>
    </motion.div>
  );
}
