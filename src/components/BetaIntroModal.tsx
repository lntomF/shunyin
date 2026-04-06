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
          transition={{ duration: 0.24, ease: [0.2, 0, 0, 1] }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-[#02060f]/78 px-4 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.985 }}
            transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
            className="console-panel relative w-full max-w-xl overflow-hidden rounded-[2rem] p-6 md:p-7"
          >
            <div className="console-grid absolute inset-0 opacity-18" />
            <div className="pointer-events-none absolute -left-8 top-0 h-40 w-40 rounded-full bg-secondary/12 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-44 w-44 rounded-full bg-tertiary/10 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/65 to-transparent" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-secondary">
                <Sparkles size={13} />
                {dict.betaIntroModalBadge}
              </div>

              <h2 className="mt-5 font-headline text-2xl font-bold tracking-[-0.04em] text-primary md:text-[2rem]">
                {dict.betaIntroModalTitle}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-on-surface-variant">
                {dict.betaIntroModalDescription}
              </p>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={onAcknowledge}
                  className="group inline-flex items-center gap-3 rounded-[1.2rem] border border-secondary/20 bg-primary px-5 py-3 text-sm font-headline font-bold uppercase tracking-[0.18em] text-surface shadow-[0_12px_32px_rgba(121,216,255,0.16)] shutter-transition hover:bg-white"
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
