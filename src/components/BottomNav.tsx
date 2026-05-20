import { Camera, ImagePlus, Share, SlidersHorizontal, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import type { Dictionary } from '../i18n/translations';
import type { ViewType } from '../types/app';

interface BottomNavProps {
  currentView: ViewType;
  setCurrentView: (view: ViewType) => void;
  dict: Dictionary;
}

export function BottomNav({ currentView, setCurrentView, dict }: BottomNavProps) {
  const navItems: Array<{ id: ViewType; icon: typeof Camera; label: string }> = [
    { id: 'import', icon: ImagePlus, label: dict.navImport },
    { id: 'ai', icon: Sparkles, label: dict.navAi },
    { id: 'editor', icon: SlidersHorizontal, label: dict.navEditor },
    { id: 'export', icon: Share, label: dict.navExport },
  ];

  const activeView = currentView === 'styles' ? 'editor' : currentView;
  const jellySpring = {
    type: 'spring',
    stiffness: 440,
    damping: 26,
    mass: 0.86,
  } as const;

  return (
    <nav className="pointer-events-none fixed bottom-0 left-0 z-50 w-full">
      <div className="bottom-nav-shell bg-gradient-to-t from-background via-background/84 to-transparent px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-5 sm:px-4 sm:pb-4 xl:px-8">
        <div className="dock-shell pointer-events-auto mx-auto flex w-full max-w-xl items-center justify-around rounded-2xl p-1.5">
          {navItems.map(({ id, icon: Icon, label }) => {
            const isActive = activeView === id;
            return (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
                className={`group relative flex min-h-14 flex-1 flex-col items-center justify-center rounded-xl px-2 py-1.5 transition-colors duration-300 active:scale-95 sm:px-4 sm:py-2 ${
                  isActive ? 'text-background' : 'text-outline hover:text-secondary'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottom-nav-jelly"
                    className="absolute inset-0 rounded-xl bg-primary shadow-[0_10px_30px_rgba(139,223,255,0.18)]"
                    transition={jellySpring}
                  >
                    <span className="absolute inset-x-4 -top-1 h-px bg-gradient-to-r from-transparent via-secondary to-transparent" />
                    <span className="absolute inset-x-5 bottom-1 h-2 rounded-full bg-secondary/20 blur-md" />
                  </motion.span>
                )}
                {!isActive && <span className="absolute inset-0 rounded-xl bg-white/0 transition-colors duration-300 group-hover:bg-white/5" />}
                <motion.span
                  className="relative z-10 mb-0.5 sm:mb-1"
                  animate={isActive ? { y: -1, scaleX: 1.08, scaleY: 0.94 } : { y: 0, scaleX: 1, scaleY: 1 }}
                  transition={jellySpring}
                >
                  <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                </motion.span>
                <motion.span
                  className="relative z-10 font-sans text-[10px] tracking-tight font-medium uppercase"
                  animate={isActive ? { y: 1, scaleX: 1.04, scaleY: 0.98 } : { y: 0, scaleX: 1, scaleY: 1 }}
                  transition={jellySpring}
                >
                  {label}
                </motion.span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
