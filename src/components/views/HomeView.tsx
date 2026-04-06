import { useEffect, useRef } from 'react';
import { FolderOpen, ImagePlus } from 'lucide-react';
import { motion } from 'motion/react';
import type { Dictionary } from '../../i18n/translations';
import type { Language, SessionItem, UploadError, UploadStatus, WorkspaceImage } from '../../types/app';
import { ACCEPTED_IMAGE_TYPES } from '../../utils/image';

interface HomeViewProps {
  dict: Dictionary;
  language: Language;
  sessions: SessionItem[];
  cloudSessions: SessionItem[];
  showCloudSessions: boolean;
  sourceImage: WorkspaceImage;
  workspaceCount: number;
  uploadStatus: UploadStatus;
  uploadError: UploadError;
  onImportFiles: (files: File[]) => void | Promise<void>;
  onUploadStatusChange: (status: UploadStatus) => void;
  onOpenSession: (sessionId: string) => void;
  onOpenCloudSession: (session: SessionItem) => void | Promise<void>;
  onDeleteCloudSession: (session: SessionItem) => void | Promise<void>;
  deletingCloudWorkspaceId?: string | null;
  onContinueEditing: () => void;
  onUseDemo: () => void;
  onOpenSettings: () => void;
}

export function HomeView({
  dict,
  sourceImage,
  workspaceCount,
  onImportFiles,
  onUploadStatusChange,
  onContinueEditing,
  onUseDemo,
}: HomeViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | File[] | null | undefined) => {
    const nextFiles = Array.from(files ?? []);
    if (!nextFiles.length) return;
    onImportFiles(nextFiles);
    if (inputRef.current) inputRef.current.value = '';
  };

  // 全页面拖拽支持
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      onUploadStatusChange('dragging');
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) {
        onUploadStatusChange(sourceImage.source === 'local' ? 'ready' : 'idle');
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      onUploadStatusChange(sourceImage.source === 'local' ? 'ready' : 'idle');
      handleFiles(e.dataTransfer?.files);
    };

    document.addEventListener('dragover', onDragOver);
    document.addEventListener('dragleave', onDragLeave);
    document.addEventListener('drop', onDrop);
    return () => {
      document.removeEventListener('dragover', onDragOver);
      document.removeEventListener('dragleave', onDragLeave);
      document.removeEventListener('drop', onDrop);
    };
  }, [sourceImage.source]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="mx-auto max-w-7xl px-6 pb-40 pt-28 lg:px-12"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {/* ── Hero Banner ───────────────────────────────────────── */}
      <section className="text-center">
        <span className="mb-8 inline-flex items-center rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">
          {dict.workspaceLabel}
        </span>

        <h2 className="mx-auto mt-6 max-w-4xl font-headline text-6xl font-bold leading-[0.9] tracking-[-0.05em] text-primary lg:text-8xl">
          <span className="block">{dict.homeHeadingLine1}</span>
          <span className="block text-secondary">{dict.homeHeadingLine2}</span>
        </h2>

        <p className="mx-auto mt-8 max-w-xl text-base leading-8 text-on-surface-variant">
          {dict.heroDesc}
        </p>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="group flex items-center gap-3 rounded-[1.35rem] border border-secondary/25 bg-primary px-7 py-4 text-surface shadow-[0_12px_32px_rgba(121,216,255,0.18)] shutter-transition hover:-translate-y-0.5 hover:bg-white active:scale-[0.98]"
          >
            <ImagePlus size={18} className="group-hover:translate-x-0.5 shutter-transition" />
            <span className="font-headline text-sm font-bold uppercase tracking-widest">{dict.btnImport}</span>
          </button>
          <button
            type="button"
            onClick={onUseDemo}
            className="console-panel flex items-center gap-3 rounded-[1.35rem] px-7 py-4 text-primary shutter-transition hover:-translate-y-0.5 hover:border-secondary/30"
          >
            <FolderOpen size={18} />
            <span className="font-headline text-sm font-bold uppercase tracking-widest">{dict.useDemo}</span>
          </button>
        </div>

      </section>
    </motion.div>
  );
}
