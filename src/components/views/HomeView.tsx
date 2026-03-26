import { useRef } from 'react';
import { Clock3, FolderOpen, ImagePlus, Images, Upload } from 'lucide-react';
import { motion } from 'motion/react';
import type { Dictionary } from '../../i18n/translations';
import type { Language, SessionItem, UploadError, UploadStatus, WorkspaceImage } from '../../types/app';
import { ACCEPTED_IMAGE_TYPES } from '../../utils/image';
import { formatRelativeTime } from '../../utils/format';

interface HomeViewProps {
  dict: Dictionary;
  language: Language;
  sessions: SessionItem[];
  sourceImage: WorkspaceImage;
  workspaceCount: number;
  uploadStatus: UploadStatus;
  uploadError: UploadError;
  onImportFiles: (files: File[]) => void | Promise<void>;
  onUploadStatusChange: (status: UploadStatus) => void;
  onOpenSession: (sessionId: string) => void;
  onContinueEditing: () => void;
  onUseDemo: () => void;
}

export function HomeView({
  dict,
  language,
  sessions,
  sourceImage,
  workspaceCount,
  uploadStatus,
  uploadError,
  onImportFiles,
  onUploadStatusChange,
  onOpenSession,
  onContinueEditing,
  onUseDemo,
}: HomeViewProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [featuredSession, ...gridSessions] = sessions;

  const statusMessage = (() => {
    if (uploadStatus === 'loading') {
      return dict.importLoading;
    }

    if (uploadError === 'invalid_type') {
      return dict.importInvalidType;
    }

    if (uploadError === 'file_too_large') {
      return dict.importFileTooLarge;
    }

    if (uploadError === 'import_failed') {
      return dict.importFailed;
    }

    if (uploadStatus === 'dragging') {
      return dict.dropActive;
    }

    return dict.statusReady;
  })();

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
      className="mx-auto max-w-7xl px-6 pb-32 pt-24 lg:px-12"
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        multiple
        className="hidden"
        onChange={(event) => handleFiles(event.target.files)}
      />

      <section className="mb-14 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-5">
          <div className="space-y-3">
            <span className="font-headline text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
              {dict.workspaceLabel}
            </span>
            <h2 className="font-headline text-5xl font-extrabold leading-none tracking-tighter text-primary lg:text-6xl">
              <span className="block">{dict.homeHeadingLine1}</span>
              <span className="block">{dict.homeHeadingLine2}</span>
            </h2>
            <p className="max-w-sm text-sm leading-relaxed text-on-surface-variant">{dict.heroDesc}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => inputRef.current?.click()}
              className="group flex items-center justify-between rounded-md bg-primary px-5 py-4 text-surface shutter-transition hover:bg-white active:scale-[0.98]"
            >
              <span className="font-headline text-sm font-bold uppercase tracking-widest">{dict.btnImport}</span>
              <ImagePlus size={18} className="group-hover:translate-x-1 shutter-transition" />
            </button>
            <button
              onClick={onUseDemo}
              className="flex items-center justify-between rounded-md border border-outline-variant/30 bg-surface-container-low px-5 py-4 text-primary shutter-transition hover:border-secondary/40 hover:bg-surface-container"
            >
              <span className="font-headline text-sm font-bold uppercase tracking-widest">{dict.useDemo}</span>
              <FolderOpen size={18} />
            </button>
          </div>

          <div className="rounded-2xl bg-surface-container-low p-5 ghost-border">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">{dict.currentWorkspace}</div>
                <div className="mt-2 font-headline text-xl font-bold text-primary">{sourceImage.name}</div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-on-surface-variant">
                  <span>{sourceImage.source === 'local' ? dict.localSource : dict.demoSource}</span>
                  <span>{workspaceCount} {dict.itemsLabel}</span>
                </div>
              </div>
              <button
                onClick={onContinueEditing}
                className="rounded-full bg-surface-container-high px-4 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary hover:bg-surface-bright"
              >
                {dict.resumeEditing}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragEnter={(event) => {
              event.preventDefault();
              onUploadStatusChange('dragging');
            }}
            onDragOver={(event) => {
              event.preventDefault();
              onUploadStatusChange('dragging');
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              onUploadStatusChange(sourceImage.source === 'local' ? 'ready' : 'idle');
            }}
            onDrop={(event) => {
              event.preventDefault();
              onUploadStatusChange(sourceImage.source === 'local' ? 'ready' : 'idle');
              handleFiles(event.dataTransfer.files);
            }}
            className={`relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl bg-surface-container-low p-8 ghost-border shutter-transition ${
              uploadStatus === 'dragging' ? 'border-secondary/60 bg-surface-container' : 'hover:border-secondary/30 hover:bg-surface-container'
            }`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-secondary/20 via-transparent to-transparent opacity-70" />
            <div className="relative flex aspect-[16/10] w-full flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-surface-bright shadow-2xl">
                <Upload size={32} className="text-primary" strokeWidth={1.5} />
              </div>
              <h3 className="font-headline text-2xl font-bold text-on-surface">{dict.dropTitle}</h3>
              <p className="mt-3 max-w-md text-sm text-on-surface-variant">{dict.dropDesc}</p>
              <div className="mt-6 rounded-full border border-outline-variant/20 bg-surface-container-high px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-secondary">
                {dict.importFormats}
              </div>
              <div className="mt-4 text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">{statusMessage}</div>
            </div>
          </button>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex items-baseline justify-between border-b border-outline-variant/10 pb-4">
          <div>
            <h4 className="font-headline text-xs font-bold uppercase tracking-[0.2em] text-on-surface-variant">{dict.sessionsTitle}</h4>
            <p className="mt-2 text-xs text-outline">{dict.sessionsDesc}</p>
          </div>
          <button onClick={onContinueEditing} className="text-[10px] uppercase tracking-widest text-secondary hover:text-primary transition-colors">
            {dict.viewArchive}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
          {featuredSession && (
            <button
              onClick={() => onOpenSession(featuredSession.id)}
              className="group relative col-span-1 row-span-2 aspect-square overflow-hidden rounded-2xl bg-surface-container-lowest text-left md:col-span-2"
            >
              <img
                src={featuredSession.coverSrc}
                alt={featuredSession.title}
                className="h-full w-full object-cover opacity-80 shutter-transition group-hover:scale-105 group-hover:opacity-100"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="text-[9px] uppercase tracking-[0.24em] text-secondary">{dict.featuredSessionLabel}</div>
                <div className="mt-2 font-headline text-2xl font-bold text-primary">{featuredSession.title}</div>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] uppercase tracking-[0.16em] text-on-surface-variant">
                  <span className="flex items-center gap-1"><Images size={12} /> {featuredSession.itemCount} {dict.itemsLabel}</span>
                  <span className="flex items-center gap-1"><Clock3 size={12} /> {formatRelativeTime(featuredSession.updatedAt, language)}</span>
                </div>
              </div>
            </button>
          )}

          {gridSessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onOpenSession(session.id)}
              className="group relative aspect-square overflow-hidden rounded-2xl bg-surface-container-lowest text-left"
            >
              <img
                src={session.coverSrc}
                alt={session.title}
                className="h-full w-full object-cover opacity-65 shutter-transition group-hover:scale-110 group-hover:opacity-95"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="font-headline text-sm font-bold text-primary">{session.title}</div>
                <div className="mt-2 text-[10px] uppercase tracking-[0.18em] text-on-surface-variant">
                  {formatRelativeTime(session.updatedAt, language)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </motion.div>
  );
}
