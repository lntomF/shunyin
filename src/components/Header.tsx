import { Camera, Settings } from 'lucide-react';
import type { Dictionary } from '../i18n/translations';
import type { Language, WorkspaceImage } from '../types/app';
import { HeaderSignalStrip } from './HeaderSignalStrip';

interface HeaderProps {
  dict: Dictionary;
  language: Language;
  setLanguage: (lang: Language) => void;
  brandName: string;
  settingsLabel: string;
  sourceImage: WorkspaceImage;
  onOpenSettings: () => void;
}

export function Header({
  dict,
  language,
  setLanguage,
  brandName,
  settingsLabel,
  sourceImage,
  onOpenSettings,
}: HeaderProps) {
  return (
    <header className="fixed top-0 z-50 w-full bg-[linear-gradient(180deg,rgba(7,16,29,0.92),rgba(7,16,29,0.5)_72%,transparent)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-5 px-6 py-4">
        <div className="flex shrink-0 items-center gap-4">
          <button aria-label={brandName} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-secondary/20 bg-surface-container-high text-secondary shutter-transition hover:-translate-y-0.5 hover:border-secondary/35 active:scale-95">
            <Camera size={24} strokeWidth={1.5} />
          </button>
          <div className="hidden sm:block">
            <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-secondary/85">Local-first beta</div>
            <h1 className="mt-1 font-headline text-lg font-bold tracking-[0.22em] text-primary">{brandName}</h1>
          </div>
        </div>

        <HeaderSignalStrip dict={dict} sourceImage={sourceImage} />

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <div className="console-panel mr-1 flex items-center gap-1 rounded-full p-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest shutter-transition ${
                language === 'en' ? 'bg-surface-bright text-primary' : 'text-outline hover:text-on-surface-variant'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('zh')}
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest shutter-transition ${
                language === 'zh' ? 'bg-surface-bright text-primary' : 'text-outline hover:text-on-surface-variant'
              }`}
            >
              ZH
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={settingsLabel}
            className="console-panel flex items-center justify-center rounded-full p-2 text-primary shutter-transition hover:-translate-y-0.5 hover:text-secondary active:scale-95"
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
