import { useEffect, useRef, useState } from 'react';
import { FolderOpen, ImagePlus } from 'lucide-react';
import { motion } from 'motion/react';
import type { Dictionary } from '../../i18n/translations';
import type { Language, SessionItem, UploadError, UploadStatus, WorkspaceImage } from '../../types/app';
import { ACCEPTED_IMAGE_TYPES } from '../../utils/image';
import { MatrixMorphCanvas } from '../MatrixMorphCanvas';

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
  const imageSrc = sourceImage.objectUrl ?? sourceImage.src;
  const headingLine1Chars = Array.from(dict.homeHeadingLine1);
  const headingLine2Chars = Array.from(dict.homeHeadingLine2);
  const [typedLine1Length, setTypedLine1Length] = useState(0);
  const [typedLine2Length, setTypedLine2Length] = useState(0);
  const [typingPhase, setTypingPhase] = useState<'typing-line-1' | 'typing-line-2' | 'pause' | 'deleting-line-2' | 'deleting-line-1'>('typing-line-1');

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
      <section className="relative overflow-hidden rounded-[2rem] border border-secondary/10 bg-[radial-gradient(circle_at_top_left,rgba(121,216,255,0.08),transparent_28%),linear-gradient(180deg,rgba(8,16,30,0.94),rgba(5,10,20,0.9))] text-center shadow-[0_28px_80px_rgba(2,7,18,0.42)]">
        <div className="pointer-events-none absolute inset-0">
          <MatrixMorphCanvas imageSrc={imageSrc} variant="hero" />
        </div>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(121,216,255,0.12),transparent_24%),radial-gradient(circle_at_80%_62%,rgba(110,231,200,0.08),transparent_22%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(7,16,29,0.16),rgba(7,16,29,0.28)_34%,rgba(7,16,29,0.72))]" />

        <div className="relative px-6 py-16 sm:px-10 sm:py-20 lg:px-16 lg:py-24">
          <span className="mb-8 inline-flex items-center rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-secondary">
            {dict.workspaceLabel}
          </span>

          <h2 className="mx-auto mt-6 max-w-4xl font-headline text-6xl font-bold leading-[0.9] tracking-[-0.05em] text-primary lg:text-8xl">
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
        </div>
      </section>
    </motion.div>
  );
}
