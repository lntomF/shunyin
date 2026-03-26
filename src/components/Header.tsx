import { Camera, Settings } from 'lucide-react';
import type { Language } from '../types/app';

interface HeaderProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  brandName: string;
  settingsLabel: string;
}

export function Header({ language, setLanguage, brandName, settingsLabel }: HeaderProps) {
  return (
    <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md bg-gradient-to-b from-surface-container-low to-transparent">
      <div className="flex justify-between items-center px-6 py-4 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button aria-label={brandName} className="text-primary hover:text-secondary shutter-transition active:scale-95">
            <Camera size={24} strokeWidth={1.5} />
          </button>
          <h1 className="text-primary font-headline tracking-[0.2em] font-black text-lg hidden sm:block">
            {brandName}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 mr-2 bg-surface-container-high/50 rounded-full p-1 ghost-border">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full shutter-transition tracking-widest ${
                language === 'en' ? 'bg-surface-bright text-primary' : 'text-outline hover:text-on-surface-variant'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('zh')}
              className={`px-2 py-0.5 text-[10px] font-bold rounded-full shutter-transition tracking-widest ${
                language === 'zh' ? 'bg-surface-bright text-primary' : 'text-outline hover:text-on-surface-variant'
              }`}
            >
              ZH
            </button>
          </div>
          <button aria-label={settingsLabel} className="text-primary hover:text-secondary shutter-transition active:scale-95">
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
