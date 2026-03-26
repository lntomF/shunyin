import { ArrowRight, CheckCircle2, Download, FileImage, Images, Layers3, LoaderCircle, Share2 } from 'lucide-react';
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
  exportHistory,
  exportSettings,
  exportStatus,
  notice,
  previewMode,
  selectedStyle,
  selectedStyleTitle,
  onSelectImage,
  onExportSettingsChange,
  onExportCurrent,
  onExportAll,
}: ExportViewProps) {
  const latestHistory = exportHistory[0];
  const hasMultiple = workspaceItems.length > 1;
  const statusMessage = notice === 'export_failed'
    ? dict.exportFailed
    : exportStatus === 'rendering'
      ? dict.exportRendering
      : notice === 'export_done'
        ? dict.exportCompleted
        : dict.exportReady;
  const getHistoryStatus = (status: ExportHistoryItem['status']) => (
    status === 'downloaded' ? dict.exportStatusDownloaded : dict.exportStatusReady
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.2, 0, 0, 1] }}
      className="mx-auto max-w-7xl px-6 pb-32 pt-24 lg:px-12"
    >
      <section className="mb-6">
        <WorkspaceStrip
          title={dict.imageQueueTitle}
          items={workspaceItems}
          selectedImageId={selectedImageId}
          onSelectImage={onSelectImage}
        />
      </section>

      <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="font-headline text-sm font-bold uppercase tracking-[0.2em] text-secondary">{dict.exportTitle}</span>
              <h1 className="mt-2 font-headline text-4xl font-black tracking-tight text-primary md:text-5xl">{dict.exportTitle}</h1>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-on-surface-variant">{dict.exportDesc}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onExportCurrent}
                disabled={exportStatus === 'rendering'}
                className="hidden items-center gap-2 rounded-md border border-outline-variant/20 bg-surface-container-low px-4 py-3 text-xs font-bold uppercase tracking-widest text-primary transition-colors hover:border-secondary/40 hover:bg-surface-container disabled:cursor-wait disabled:opacity-60 md:flex"
              >
                {exportStatus === 'rendering' ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
                {dict.exportCurrentLabel}
              </button>
              <button
                onClick={onExportAll}
                disabled={exportStatus === 'rendering'}
                className="hidden items-center gap-2 rounded-md bg-primary px-4 py-3 text-xs font-bold uppercase tracking-widest text-surface transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60 md:flex"
              >
                {exportStatus === 'rendering' ? <LoaderCircle size={16} className="animate-spin" /> : <Images size={16} />}
                {hasMultiple ? dict.exportAllLabel : dict.exportNow}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl bg-surface-container-low shadow-2xl ghost-border">
            <PreviewStage
              image={sourceImage}
              exifData={exifData}
              styleTemplate={selectedStyle}
              styleTitle={selectedStyleTitle}
              brandName={dict.brandName}
              previewMode={previewMode === 'original' ? 'processed' : previewMode}
              alt={sourceImage.name}
            />
            <div className="grid grid-cols-1 gap-3 border-t border-outline-variant/10 px-5 py-5 md:grid-cols-3">
              <div className="rounded-xl border border-outline-variant/15 bg-surface/75 p-4 backdrop-blur-md">
                <div className="mb-2 text-[9px] uppercase tracking-[0.25em] text-on-surface-variant">{dict.fileNameLabel}</div>
                <div className="text-sm font-mono text-primary">{exportSettings.fileName}.{exportSettings.format.toLowerCase()}</div>
              </div>
              <div className="rounded-xl border border-outline-variant/15 bg-surface/75 p-4 backdrop-blur-md">
                <div className="mb-2 text-[9px] uppercase tracking-[0.25em] text-on-surface-variant">{dict.formatLabel}</div>
                <div className="text-sm font-mono text-primary">{exportSettings.format} · {exportSettings.quality}</div>
              </div>
              <div className="rounded-xl border border-outline-variant/15 bg-surface/75 p-4 backdrop-blur-md">
                <div className="mb-2 text-[9px] uppercase tracking-[0.25em] text-on-surface-variant">{dict.previewMode}</div>
                <div className="text-sm font-mono text-primary">{previewMode === 'processed' ? dict.processed : dict.original}</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-5">
          <div className="space-y-5 rounded-2xl bg-surface-container-low p-6 ghost-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-headline text-xl font-bold text-primary">{dict.summaryCard}</h2>
                <p className="mt-1 text-xs text-on-surface-variant">{statusMessage}</p>
              </div>
              <CheckCircle2 size={22} className="text-secondary" />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-lg bg-surface-container-high px-4 py-3">
                <span className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{dict.sourceImage}</span>
                <span className="text-sm font-medium text-primary">{sourceImage.name}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-container-high px-4 py-3">
                <span className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{dict.totalImagesLabel}</span>
                <span className="text-sm font-medium text-primary">{workspaceItems.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-container-high px-4 py-3">
                <span className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{dict.selectedStyle}</span>
                <span className="text-sm font-medium text-primary">{selectedStyleTitle}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-container-high px-4 py-3">
                <span className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{dict.outputFormat}</span>
                <span className="text-sm font-medium text-primary">{exportSettings.format} / {exportSettings.quality}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface-container-high px-4 py-3">
                <span className="text-xs uppercase tracking-[0.2em] text-on-surface-variant">{dict.metadataLabel}</span>
                <span className="text-sm font-medium text-primary">{exifData.cameraBody}</span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={onExportAll}
                disabled={exportStatus === 'rendering'}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-4 text-sm font-headline font-black uppercase tracking-[0.2em] text-surface transition-transform hover:bg-white active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              >
                {exportStatus === 'rendering' ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                {hasMultiple ? `${dict.exportAllLabel} (${workspaceItems.length})` : dict.exportNow}
              </button>

              {hasMultiple && (
                <button
                  onClick={onExportCurrent}
                  disabled={exportStatus === 'rendering'}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-outline-variant/15 bg-surface-container-high px-5 py-4 text-sm font-headline font-black uppercase tracking-[0.2em] text-primary transition-transform hover:border-secondary/40 hover:bg-surface-container active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                >
                  {exportStatus === 'rendering' ? <LoaderCircle size={16} className="animate-spin" /> : <Download size={16} />}
                  {dict.exportCurrentLabel}
                </button>
              )}
            </div>

            {hasMultiple && <p className="text-xs leading-relaxed text-on-surface-variant">{dict.batchExportHint}</p>}
          </div>

          <div className="space-y-4 rounded-2xl bg-surface-container-high p-6 ghost-border">
            <div className="flex items-center gap-3">
              <Share2 size={18} className="text-secondary" />
              <h2 className="font-headline text-lg font-bold text-primary">{dict.recentHistory}</h2>
            </div>

            <div className="space-y-3">
              {exportHistory.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-xl border border-outline-variant/15 bg-surface-container-low px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm text-primary">{item.fileName}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{getHistoryStatus(item.status)} · {item.format}</div>
                  </div>
                  <FileImage size={16} className="shrink-0 text-outline-variant" />
                </div>
              ))}
              {!exportHistory.length && <div className="text-sm text-on-surface-variant">{dict.noExportsYet}</div>}
            </div>

            {latestHistory && (
              <div className="overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-low">
                <img src={latestHistory.previewSrc} alt={latestHistory.fileName} className="aspect-video w-full object-cover opacity-80" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-surface-container-low p-6 ghost-border">
            <div className="flex items-center gap-3">
              <Layers3 size={18} className="text-tertiary" />
              <div>
                <h3 className="font-headline text-lg font-bold text-primary">{selectedStyleTitle}</h3>
                <p className="mt-1 text-xs text-on-surface-variant">{dict.styleReady}</p>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <label className="space-y-2 rounded-xl bg-surface-container-low p-4 ghost-border">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{dict.fileNameLabel}</span>
          <input
            type="text"
            value={exportSettings.fileName}
            onChange={(event) => onExportSettingsChange('fileName', event.target.value)}
            className="w-full rounded-lg border border-transparent bg-surface-container-high px-4 py-3 text-sm text-primary outline-none focus:border-secondary/40"
          />
        </label>

        <label className="space-y-2 rounded-xl bg-surface-container-low p-4 ghost-border">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{dict.formatLabel}</span>
          <select
            value={exportSettings.format}
            onChange={(event) => onExportSettingsChange('format', event.target.value as ExportSettings['format'])}
            className="w-full rounded-lg border border-transparent bg-surface-container-high px-4 py-3 text-sm text-primary outline-none focus:border-secondary/40"
          >
            <option value="JPG">JPG</option>
            <option value="PNG">PNG</option>
          </select>
        </label>

        <label className="space-y-2 rounded-xl bg-surface-container-low p-4 ghost-border">
          <span className="block text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">{dict.qualityLabel}</span>
          <select
            value={exportSettings.quality}
            onChange={(event) => onExportSettingsChange('quality', event.target.value as ExportSettings['quality'])}
            className="w-full rounded-lg border border-transparent bg-surface-container-high px-4 py-3 text-sm text-primary outline-none focus:border-secondary/40"
          >
            <option value="web">{dict.qualityWeb}</option>
            <option value="standard">{dict.qualityStandard}</option>
            <option value="max">{dict.qualityMax}</option>
          </select>
        </label>
      </section>
    </motion.div>
  );
}
