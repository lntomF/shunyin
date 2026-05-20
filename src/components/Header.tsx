import { Camera, CircleDot, Settings, Sun, Moon } from 'lucide-react';
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
    <header className="fixed top-0 z-50 w-full site-header backdrop-blur-2xl">
      <div className="mx-auto flex w-full max-w-[1920px] items-center gap-3 px-3 py-3 sm:gap-5 sm:px-6 sm:py-4 xl:px-8">
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <button aria-label={brandName} className="kinetic-border studio-sheen flex h-10 w-10 items-center justify-center rounded-xl border border-secondary/20 bg-surface-container-high text-secondary shadow-[0_14px_36px_rgba(0,0,0,0.24)] shutter-transition hover:-translate-y-0.5 hover:border-secondary/40 hover:text-tertiary active:scale-95 sm:h-11 sm:w-11">
            <Camera size={22} strokeWidth={1.5} />
          </button>
          <div className="hidden sm:block">
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.28em] text-secondary/85">
              <CircleDot size={10} className="preview-glow fill-secondary/20" />
              Local-first beta
            </div>
            <h1 className="mt-1 font-headline text-base font-bold tracking-[0.18em] text-primary drop-shadow-[0_0_18px_rgba(139,223,255,0.18)]">{brandName}</h1>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-3">
          <button
            type="button"
            onClick={() => setTheme(nextTheme)}
            aria-label={themeToggleLabel}
            title={themeToggleLabel}
            aria-pressed={theme === 'light'}
            className="dock-shell flex items-center justify-center rounded-xl p-1.5 text-primary shutter-transition hover:-translate-y-0.5 hover:text-secondary active:scale-95 sm:p-2"
          >
            {theme === 'dark' ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
          </button>

          <div className="dock-shell flex items-center gap-1 rounded-xl p-1 sm:mr-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-widest shutter-transition ${
                language === 'en' ? 'bg-primary text-background shadow-[0_0_18px_rgba(139,223,255,0.16)]' : 'text-outline hover:text-on-surface-variant'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('zh')}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-bold tracking-widest shutter-transition ${
                language === 'zh' ? 'bg-primary text-background shadow-[0_0_18px_rgba(139,223,255,0.16)]' : 'text-outline hover:text-on-surface-variant'
              }`}
            >
              ZH
            </button>
          </div>

          <button
            type="button"
            onClick={onOpenSettings}
            aria-label={settingsLabel}
            className="dock-shell flex items-center justify-center rounded-xl p-1.5 text-primary shutter-transition hover:-translate-y-0.5 hover:text-secondary active:scale-95 sm:p-2"
          >
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
