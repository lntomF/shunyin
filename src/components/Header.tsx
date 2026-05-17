import { Camera, Settings, Sun, Moon } from 'lucide-react';
import type { Dictionary } from '../i18n/translations';
import type { Language, Theme, WorkspaceImage } from '../types/app';

interface HeaderProps {
  dict: Dictionary;
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  brandName: string;
  settingsLabel: string;
  sourceImage?: WorkspaceImage | null;
  onOpenSettings: () => void;
}

export function Header({
  dict,
  language,
  setLanguage,
  theme,
  setTheme,
  brandName,
  settingsLabel,
  sourceImage,
  onOpenSettings,
}: HeaderProps) {
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const themeToggleLabel = theme === 'dark' ? dict.switchToLightTheme : dict.switchToDarkTheme;

  return (
    <header className="fixed top-0 z-50 w-full site-header backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1920px] items-center gap-3 px-3 py-2.5 sm:gap-5 sm:px-6 sm:py-3.5 xl:px-8">
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <button aria-label={brandName} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-secondary/20 bg-surface-container-high text-secondary shutter-transition hover:-translate-y-0.5 hover:border-secondary/35 active:scale-95 sm:h-11 sm:w-11">
            <Camera size={22} strokeWidth={1.5} />
          </button>
          <div className="hidden sm:block">
            <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-secondary/85">Local-first beta</div>
            <h1 className="mt-1 font-headline text-base font-bold tracking-[0.18em] text-primary">{brandName}</h1>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
            aria-pressed={theme === 'light'}
            className="console-panel flex items-center justify-center rounded-full p-1.5 text-primary shutter-transition hover:-translate-y-0.5 hover:text-secondary active:scale-95 sm:p-2"
          >
            {theme === 'dark' ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
          </button>

          <div className="console-panel flex items-center gap-1 rounded-full p-1 sm:mr-1">
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
            className="console-panel flex items-center justify-center rounded-full p-1.5 text-primary shutter-transition hover:-translate-y-0.5 hover:text-secondary active:scale-95 sm:p-2"
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
