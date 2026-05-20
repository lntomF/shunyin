import { ArrowRight, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { Dictionary } from '../i18n/translations';

interface BetaIntroModalProps {
  dict: Dictionary;
  open: boolean;
  onAcknowledge: () => void;
}

export function BetaIntroModal({ dict, open, onAcknowledge }: BetaIntroModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-surface-container-lowest/78 px-4 py-4 backdrop-blur-2xl"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="studio-panel relative max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl p-5 sm:rounded-3xl sm:p-6 md:p-7"
          >
            <div className="studio-grid absolute inset-0 opacity-25" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/65 to-transparent" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-xl border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                <Sparkles size={13} />
                {dict.betaIntroModalBadge}
              </div>

              <h2 className="mt-5 font-headline text-2xl font-bold tracking-[0] text-primary md:text-[2rem]">
                {dict.betaIntroModalTitle}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-on-surface-variant">
                {dict.betaIntroModalDescription}
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={onAcknowledge}
                  className="studio-sheen group inline-flex items-center gap-3 rounded-xl border border-secondary/20 bg-primary px-5 py-3 text-sm font-headline font-bold uppercase tracking-[0.18em] text-background shadow-[0_16px_42px_rgba(139,223,255,0.14)] shutter-transition hover:-translate-y-0.5 hover:opacity-95"
                >
                  <span>{dict.betaIntroModalConfirm}</span>
                  <ArrowRight size={16} className="shutter-transition group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
