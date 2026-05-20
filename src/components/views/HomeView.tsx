import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Sparkles } from 'lucide-react';
import type { Dictionary } from '../../i18n/translations';
import type { Theme, UploadError, UploadStatus, WorkspaceImage } from '../../types/app';
import { ACCEPTED_IMAGE_EXTENSIONS, ACCEPTED_IMAGE_TYPES } from '../../utils/image';
import { MatrixMorphCanvas } from '../MatrixMorphCanvas';

interface HomeViewProps {
  dict: Dictionary;
  theme: Theme;
  sourceImage?: WorkspaceImage | null;
  workspaceCount: number;
  uploadStatus: UploadStatus;
  uploadError: UploadError;
  onImportFiles: (files: File[]) => void | Promise<void>;
  onUploadStatusChange: (status: UploadStatus) => void;
  onContinueEditing: () => void;
  onOpenAiWorkspace: () => void;
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
  onOpenAiWorkspace,
}: HomeViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = 'shunyin-photo-import';
  const imageSrc = sourceImage?.objectUrl ?? sourceImage?.src;
  const headingLine1Chars = Array.from(dict.homeHeadingLine1);
  const headingLine2Chars = Array.from(dict.homeHeadingLine2);
  const headingSeparator = /^[\x00-\x7F]+$/.test(dict.homeHeadingLine1) && /^[\x00-\x7F]+$/.test(dict.homeHeadingLine2) ? ' ' : '';
  const headingChars = Array.from(`${dict.homeHeadingLine1}${headingSeparator}${dict.homeHeadingLine2}`);
  const line1End = headingLine1Chars.length;
  const line2Start = line1End + headingSeparator.length;
  const [typedHeadingLength, setTypedHeadingLength] = useState(0);
  const [typingPhase, setTypingPhase] = useState<'typing' | 'pause' | 'deleting'>('typing');

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
    setTypedHeadingLength(0);
    setTypingPhase('typing');
  }, [dict.homeHeadingLine1, dict.homeHeadingLine2]);

  useEffect(() => {
    const typingDelay = 130;
    const deletingDelay = 70;
    const loopPauseDelay = 1400;

    const timeout = window.setTimeout(() => {
      switch (typingPhase) {
        case 'typing':
          if (typedHeadingLength < headingChars.length) {
            setTypedHeadingLength((current) => current + 1);
            return;
          }
          setTypingPhase('pause');
          return;
        case 'pause':
          setTypingPhase('deleting');
          return;
        case 'deleting':
          if (typedHeadingLength > 0) {
            setTypedHeadingLength((current) => current - 1);
            return;
          }
          setTypingPhase('typing');
          return;
        default:
          return;
      }
    }, typingPhase === 'pause'
      ? loopPauseDelay
      : typingPhase === 'typing'
        ? typingDelay
        : deletingDelay);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [headingChars.length, typedHeadingLength, typingPhase]);

  const typedLine1 = headingChars.slice(0, Math.min(typedHeadingLength, line1End)).join('');
  const typedSeparator = typedHeadingLength > line1End ? headingChars.slice(line1End, Math.min(typedHeadingLength, line2Start)).join('') : '';
  const typedLine2 = typedHeadingLength > line2Start ? headingChars.slice(line2Start, typedHeadingLength).join('') : '';
  const fullHeading = `${dict.homeHeadingLine1}${headingSeparator}${dict.homeHeadingLine2}`;
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
    <div
      className="mx-auto min-h-[calc(100dvh-7.5rem)] w-full max-w-[1920px] px-3 pb-28 pt-20 sm:px-5 sm:pb-32 sm:pt-24 lg:px-6 xl:px-8"
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

      <section className="hero-section relative min-h-[calc(100dvh-12rem)] overflow-hidden rounded-2xl text-center sm:rounded-3xl">
        <div className="pointer-events-none absolute inset-0">
          <MatrixMorphCanvas imageSrc={imageSrc} variant="hero" theme={theme} />
        </div>
        <div className="studio-grid pointer-events-none absolute inset-0 opacity-35" />
        <div className="pointer-events-none absolute inset-0 hero-overlay-accent" />
        <div className="pointer-events-none absolute inset-0 hero-overlay-gradient" />
        <div className="animated-rail pointer-events-none absolute left-[-20%] top-8 h-px w-[140%] bg-gradient-to-r from-transparent via-secondary/35 to-transparent" />
        <div className="animated-rail pointer-events-none absolute bottom-10 left-[-20%] h-px w-[140%] bg-gradient-to-r from-transparent via-tertiary/20 to-transparent" />

        <div className="relative flex min-h-[calc(100dvh-12rem)] flex-col items-center justify-center px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-14 xl:py-18">
          <span className="mb-5 inline-flex items-center rounded-xl border border-secondary/20 bg-secondary/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-secondary shadow-[0_0_32px_rgba(139,223,255,0.12)] backdrop-blur sm:mb-6 sm:px-4 sm:py-2">
            {dict.workspaceLabel}
          </span>

          <h2 className="mx-auto mt-4 max-w-5xl whitespace-nowrap font-headline text-[clamp(2.3rem,10vw,4.3rem)] font-bold leading-none tracking-[0] text-primary drop-shadow-[0_0_42px_rgba(139,223,255,0.18)] sm:text-[clamp(3rem,8vw,5.6rem)] lg:text-[clamp(4rem,6vw,6rem)]">
            <span className="relative inline-block">
              <span className="invisible">{fullHeading}</span>
              <span className="absolute inset-0">
                {typedLine1}
                {typedSeparator}
                <span className="text-secondary drop-shadow-[0_0_26px_rgba(139,223,255,0.35)]">{typedLine2}</span>
                <span className="ml-[0.05em] inline-block h-[0.88em] w-[0.08em] translate-y-[0.08em] animate-pulse bg-current align-baseline" />
              </span>
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-on-surface-variant sm:text-base sm:leading-8">
            {dict.heroDesc}
          </p>

          <div className="flow-surface mt-7 grid w-full max-w-4xl overflow-hidden rounded-2xl sm:grid-cols-2">
            <button
              type="button"
              onClick={onOpenAiWorkspace}
              className="studio-sheen group flex items-center justify-between gap-4 p-4 text-left shutter-transition hover:bg-tertiary/8 sm:p-5"
            >
              <span className="relative">
                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-tertiary">{dict.aiFeatureBadge}</span>
                <span className="mt-2 block font-headline text-lg font-bold text-primary">{dict.aiFeatureTitle}</span>
              </span>
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-tertiary/20 bg-tertiary/10 text-tertiary shadow-[0_0_28px_rgba(156,255,213,0.12)] shutter-transition group-hover:scale-105">
                <Sparkles size={19} />
              </span>
            </button>

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="studio-sheen group flex items-center justify-between gap-4 border-t border-white/6 p-4 text-left shutter-transition hover:bg-secondary/8 sm:border-l sm:border-t-0 sm:p-5"
            >
              <span className="relative">
                <span className="block text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">{dict.watermarkFeatureBadge}</span>
                <span className="mt-2 block font-headline text-lg font-bold text-primary">{dict.watermarkFeatureTitle}</span>
              </span>
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-secondary/20 bg-secondary/10 text-secondary shadow-[0_0_28px_rgba(139,223,255,0.12)] shutter-transition group-hover:scale-105">
                <ImagePlus size={19} />
              </span>
            </button>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {workspaceCount > 0 && (
              <button
                type="button"
                onClick={onContinueEditing}
                className="dock-shell rounded-xl px-5 py-3 text-sm font-headline font-bold uppercase tracking-widest text-primary shutter-transition hover:-translate-y-0.5 hover:border-secondary/30 hover:text-secondary active:scale-[0.98] sm:px-7 sm:py-4"
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
    </div>
  );
}
