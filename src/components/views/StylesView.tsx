import { Check, Clock3, History, MoreVertical, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { PreviewStage } from '../preview/PreviewStage';
import type { Dictionary } from '../../i18n/translations';
import type { ExifData, ExportHistoryItem, Language, StyleTemplate, WorkspaceImage } from '../../types/app';
import { formatRelativeTime } from '../../utils/format';

interface StylesViewProps {
  dict: Dictionary;
  language: Language;
  sourceImage: WorkspaceImage;
  exifData: ExifData;
  selectedStyleId: StyleTemplate['id'];
  styleTemplates: StyleTemplate[];
  exportHistory: ExportHistoryItem[];
  onSelectStyle: (id: StyleTemplate['id']) => void;
  onCreateNew: () => void;
}

export function StylesView({
  dict,
  language,
  sourceImage,
  exifData,
  selectedStyleId,
  styleTemplates,
  exportHistory,
  onSelectStyle,
  onCreateNew,
}: StylesViewProps) {
  const latestExport = exportHistory[0];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="mx-auto max-w-7xl px-6 pb-32 pt-24"
    >
      <section className="mb-12">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <span className="font-headline text-sm font-bold uppercase tracking-[0.2em] text-secondary">{dict.workspaceLabel}</span>
            <h1 className="mt-2 font-headline text-4xl font-black tracking-tight text-primary md:text-5xl">{dict.stylesTitle}</h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-on-surface-variant">{dict.stylesDesc}</p>
          </div>
          <button onClick={onCreateNew} className="flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-surface shadow-lg shadow-primary/5 transition-all duration-300 hover:bg-white">
            <Plus size={16} />
            {dict.resumeEditing}
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {styleTemplates.map((template) => {
          const isSelected = template.id === selectedStyleId;
          const usage = exportHistory.filter((item) => item.styleId === template.id);
          const lastUsed = usage[0]?.createdAt;

          return (
            <button
              key={template.id}
              onClick={() => onSelectStyle(template.id)}
              className={`group relative overflow-hidden rounded-2xl bg-surface-container-low text-left ghost-border transition-all duration-500 hover:border-secondary/30 ${isSelected ? 'border-secondary/40' : ''}`}
            >
              <div className="relative overflow-hidden bg-surface-container-lowest">
                <PreviewStage
                  image={sourceImage}
                  exifData={exifData}
                  styleTemplate={template}
                  styleTitle={dict[template.titleKey]}
                  brandName={dict.brandName}
                  previewMode="processed"
                  alt={dict[template.titleKey]}
                  imageClassName="opacity-65 group-hover:scale-105"
                />
                <div className="absolute right-3 top-3 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.25em] text-on-surface/80">
                  {isSelected ? <Check size={12} className="text-secondary" /> : <MoreVertical size={12} className="text-on-surface/60" />}
                  {isSelected ? dict.currentSelection : dict.selectStyle}
                </div>
              </div>

              <div className="flex items-start justify-between gap-3 p-5">
                <div>
                  <h3 className="font-headline font-bold tracking-wide text-primary">{dict[template.titleKey]}</h3>
                  <p className="mt-1 text-[10px] font-medium uppercase tracking-tighter text-on-surface-variant">{dict[template.descriptionKey]}</p>
                  <div className="mt-4 space-y-1 text-[10px] uppercase tracking-[0.18em] text-outline">
                    <div>{dict.usageCount}: {usage.length}</div>
                    <div>{dict.lastUsedLabel}: {lastUsed ? formatRelativeTime(lastUsed, language) : dict.neverUsed}</div>
                  </div>
                </div>
                {isSelected ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <Check size={18} />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-container-high text-outline-variant">
                    <MoreVertical size={18} />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <section className="mt-24">
        <h2 className="mb-8 font-headline text-xl font-bold tracking-tight text-primary">{dict.recentExports}</h2>
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex-1 overflow-hidden rounded-2xl bg-surface-container">
            {latestExport ? (
              <div className="relative aspect-video">
                <img
                  src={latestExport.previewSrc}
                  alt={latestExport.fileName}
                  className="h-full w-full object-cover opacity-70"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
                <div className="absolute bottom-6 left-6">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-secondary">{dict.styleApplied}</span>
                  <h4 className="font-headline text-lg font-black text-primary">{latestExport.fileName}</h4>
                </div>
              </div>
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-on-surface-variant">{dict.noExportsYet}</div>
            )}
          </div>
          <div className="flex w-full flex-col justify-center gap-6 rounded-2xl bg-surface-container-high p-8 md:w-80">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                <History size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">{dict.statusLabel}</div>
                <div className="text-xs text-primary">{latestExport ? dict.exportCompleted : dict.exportReady}</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
                <Clock3 size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-tighter text-on-surface-variant">{dict.lastModified}</div>
                <div className="text-xs text-primary">{latestExport ? formatRelativeTime(latestExport.createdAt, language) : dict.neverUsed}</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
