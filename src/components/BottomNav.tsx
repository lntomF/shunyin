import { Camera, Share, SlidersHorizontal } from 'lucide-react';
import type { Dictionary } from '../i18n/translations';
import type { ViewType } from '../types/app';

interface BottomNavProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  dict: Dictionary;
}

export function BottomNav({ currentView, setCurrentView, dict }: BottomNavProps) {
  const navItems: Array<{ id: ViewType; icon: typeof Camera; label: string }> = [
    { id: 'import', icon: Camera, label: dict.navImport },
    { id: 'editor', icon: SlidersHorizontal, label: dict.navEditor },
    { id: 'export', icon: Share, label: dict.navExport },
  ];

  const activeView = currentView === 'styles' ? 'editor' : currentView;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50">
      <div className="bottom-nav-shell bg-surface-container-low/90 backdrop-blur-xl border-t border-outline-variant/20">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-around px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5 sm:px-4 sm:pb-4 sm:pt-2">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`flex flex-col items-center justify-center rounded-md px-3 py-1.5 shutter-transition active:scale-95 sm:px-4 sm:py-2 ${
                  isActive ? 'text-primary bg-surface-bright' : 'text-outline-variant hover:text-secondary'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className="mb-0.5 sm:mb-1" />
                <span className="font-sans text-[10px] tracking-tight font-medium uppercase">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
