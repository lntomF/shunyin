import { useEffect, useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { motion } from 'motion/react';
import type { Dictionary } from '../../i18n/translations';
import type { Language, SessionItem, Theme, UploadError, UploadStatus, WorkspaceImage } from '../../types/app';
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from '../../utils/image';
import { MatrixMorphCanvas } from '../MatrixMorphCanvas';

interface HomeViewProps {
  dict: Dictionary;
  language: Language;
  theme: Theme;
  sessions: SessionItem[];
  cloudSessions: SessionItem[];
  showCloudSessions: boolean;
  sourceImage?: WorkspaceImage | null;
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
  onOpenSettings: () => void;
}

export function HomeView({
  dict,
  theme,
  sourceImage,
  workspaceCount,
  uploadStatus,
  uploadError,
  onImportFiles,
  onUploadStatusChange,
  onContinueEditing,
}: HomeViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = 'shunyin-photo-import';
  const imageSrc = sourceImage?.objectUrl ?? sourceImage?.src;
  const headingLine1Chars = Array.from(dict.homeHeadingLine1);
  const headingLine2Chars = Array.from(dict.homeHeadingLine2);
  const [typedLine1Length, setTypedLine1Length] = useState(0);
  const [typedLine2Length, setTypedLine2Length] = useState(0);
  const [typingPhase, setTypingPhase] = useState<'typing-line-1' | 'typing-line-2' | 'pause' | 'deleting-line-2' | 'deleting-line-1'>('typing-line-1');

  const handleFiles = (files: FileList | File[] | null | undefined) => {
    const nextFiles = Array.from(files ?? []);
    if (!nextFiles.length) {
      return;
    }

    onImportFiles(nextFiles);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  // 全页面拖拽支持
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
      onUploadStatusChange('dragging');
    };
    const onDragLeave = (e: DragEvent) => {
      if (e.relatedTarget === null) {
        onUploadStatusChange(sourceImage?.source === 'local' ? 'ready' : 'idle');
      }
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      onUploadStatusChange(sourceImage?.source === 'local' ? 'ready' : 'idle');
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
  }, [sourceImage?.source]);

  useEffect(() => {
    setTypedLine1Length(0);
    setTypedLine2Length(0);
    setTypingPhase('typing-line-1');
  }, [dict.homeHeadingLine1, dict.homeHeadingLine2]);

  useEffect(() => {
    const typingDelay = 130;
    const deletingDelay = 70;
    const linePauseDelay = 260;
    const loopPauseDelay = 1400;

    const timeout = window.setTimeout(() => {
      switch (typingPhase) {
        case 'typing-line-1':
          if (typedLine1Length < headingLine1Chars.length) {
            setTypedLine1Length((current) => current + 1);
            return;
          }
          setTypingPhase('typing-line-2');
          return;
        case 'typing-line-2':
          if (typedLine2Length < headingLine2Chars.length) {
            setTypedLine2Length((current) => current + 1);
            return;
          }
          setTypingPhase('pause');
          return;
        case 'pause':
          setTypingPhase('deleting-line-2');
          return;
        case 'deleting-line-2':
          if (typedLine2Length > 0) {
            setTypedLine2Length((current) => current - 1);
            return;
          }
          setTypingPhase('deleting-line-1');
          return;
        case 'deleting-line-1':
          if (typedLine1Length > 0) {
            setTypedLine1Length((current) => current - 1);
            return;
          }
          setTypingPhase('typing-line-1');
          return;
        default:
          return;
      }
    }, typingPhase === 'pause'
      ? loopPauseDelay
      : typingPhase === 'typing-line-1' || typingPhase === 'typing-line-2'
        ? (typingPhase === 'typing-line-2' && typedLine2Length === 0) || (typingPhase === 'typing-line-1' && typedLine1Length === headingLine1Chars.length)
          ? linePauseDelay
          : typingDelay
        : deletingDelay);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [headingLine1Chars.length, headingLine2Chars.length, typedLine1Length, typedLine2Length, typingPhase]);

  const typedLine1 = headingLine1Chars.slice(0, typedLine1Length).join('');
  const typedLine2 = headingLine2Chars.slice(0, typedLine2Length).join('');
  const isFirstLineActive = typingPhase === 'typing-line-1' || typingPhase === 'deleting-line-1';
  const isSecondLineActive = typingPhase === 'typing-line-2' || typingPhase === 'pause' || typingPhase === 'deleting-line-2';
  const uploadMessage = uploadError === 'invalid_type'
    ? dict.importInvalidType
    : uploadError === 'file_too_large'
      ? dict.importFileTooLarge
      : uploadError === 'import_failed'
        ? dict.importFailed
        : uploadStatus === 'loading'
          ? dict.importLoading
          : uploadStatus === 'dragging'
            ? dict.dropActive
            : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-6 sm:pb-32 sm:pt-24 lg:px-8"
    >
      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={[...ACCEPTED_IMAGE_TYPES, ...ACCEPTED_IMAGE_EXTENSIONS].join(',')}
        multiple
        className="sr-only"
        onChange={(event) => handleFiles(event.target.files)}
      />

      {/* ── Hero Banner ───────────────────────────────────────── */}
      <section className="hero-section relative overflow-hidden rounded-[1.4rem] border border-secondary/10 text-center shadow-[0_28px_80px_rgba(2,7,18,0.42)] sm:rounded-[2rem]">
        <div className="pointer-events-none absolute inset-0">
          <MatrixMorphCanvas imageSrc={imageSrc} variant="hero" theme={theme} />
        </div>
        <div className="pointer-events-none absolute inset-0 hero-overlay-accent" />
        <div className="pointer-events-none absolute inset-0 hero-overlay-gradient" />

        <div className="relative px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-14 xl:py-18">
          <span className="mb-5 inline-flex items-center rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-secondary sm:mb-6 sm:px-4 sm:py-2">
            {dict.workspaceLabel}
          </span>

          <h2 className="mx-auto mt-4 max-w-4xl font-headline text-[clamp(2.6rem,13vw,4.7rem)] font-bold leading-none tracking-[0] text-primary lg:text-[clamp(4.4rem,7vw,6.1rem)]">
            <span className="relative block">
              <span className="invisible">{dict.homeHeadingLine1}</span>
              <span className="absolute inset-0">
                {typedLine1}
                {isFirstLineActive && (
                  <span className="ml-[0.05em] inline-block h-[0.88em] w-[0.08em] translate-y-[0.08em] animate-pulse bg-current align-baseline" />
                )}
              </span>
            </span>
            <span className="relative block text-secondary">
              <span className="invisible">{dict.homeHeadingLine2}</span>
              <span className="absolute inset-0">
                {typedLine2}
                {isSecondLineActive && (
                  <span className="ml-[0.05em] inline-block h-[0.88em] w-[0.08em] translate-y-[0.08em] animate-pulse bg-current align-baseline" />
                )}
              </span>
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8">
            {dict.heroDesc}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4">
            <label
              htmlFor={inputId}
              className="group flex cursor-pointer items-center gap-3 rounded-[1.1rem] border border-secondary/25 bg-primary px-5 py-3 text-surface shadow-md shutter-transition hover:-translate-y-0.5 hover:opacity-90 active:scale-[0.98] sm:rounded-[1.35rem] sm:px-7 sm:py-4"
            >
              <ImagePlus size={18} className="group-hover:translate-x-0.5 shutter-transition" />
              <span className="font-headline text-sm font-bold uppercase tracking-widest">{dict.btnImport}</span>
            </label>

            {workspaceCount > 0 && (
              <button
                type="button"
                onClick={onContinueEditing}
                className="console-panel rounded-[1.1rem] px-5 py-3 text-sm font-headline font-bold uppercase tracking-widest text-primary shutter-transition hover:-translate-y-0.5 hover:border-secondary/30 hover:text-secondary active:scale-[0.98] sm:rounded-[1.35rem] sm:px-7 sm:py-4"
              >
                {dict.resumeEditing}
              </button>
            )}
          </div>

          <div className="mt-5 min-h-6 text-sm font-medium text-on-surface-variant">
            {uploadMessage ?? dict.importFormats}
          </div>
        </div>
      </section>
    </motion.div>
  );
}
