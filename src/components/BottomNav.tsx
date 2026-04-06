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
      <div className="bg-surface-container-low/90 backdrop-blur-xl border-t border-outline-variant/15 shadow-[0_-10px_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-around items-center px-4 pb-6 pt-2 w-full max-w-7xl mx-auto">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`flex flex-col items-center justify-center px-4 py-2 rounded-md shutter-transition active:scale-95 ${
                  isActive ? 'text-primary bg-surface-bright' : 'text-outline-variant hover:text-secondary'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2 : 1.5} className="mb-1" />
                <span className="font-sans text-[10px] tracking-tight font-medium uppercase">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
