import { Download, FileImage, Palette, ShieldCheck, SlidersHorizontal, X } from 'lucide-react';
import type { Dictionary } from '../i18n/translations';

interface SettingsPanelProps {
  dict: Dictionary;
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ dict, open, onClose }: SettingsPanelProps) {
  const workflowItems = [
    { icon: FileImage, text: dict.settingsLocalFeatureImport },
    { icon: SlidersHorizontal, text: dict.settingsLocalFeatureMetadata },
    { icon: Palette, text: dict.settingsLocalFeatureStyles },
    { icon: Download, text: dict.settingsLocalFeatureExport },
  ];

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center overflow-y-auto bg-surface-container-lowest/70 px-3 py-4 backdrop-blur-md sm:px-4">
      <div className="relative max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-secondary/15 bg-surface-container-lowest/90 shadow-[0_30px_80px_rgba(0,0,0,0.2)] sm:rounded-[2rem]">
        <div className="console-grid absolute inset-0 opacity-20" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/70 to-transparent" />

        <div className="relative flex items-start justify-between gap-4 border-b border-outline-variant/10 px-6 py-5 md:px-7">
          <div className="max-w-xl">
            <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-secondary">{dict.settingsBetaLabel}</div>
            <h2 className="mt-3 font-headline text-2xl font-bold tracking-[-0.03em] text-primary md:text-[2rem]">{dict.settingsTitle}</h2>
            <p className="mt-3 max-w-lg text-sm leading-7 text-on-surface-variant">{dict.settingsDescription}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={dict.settingsCloseLabel}
            className="console-panel flex h-10 w-10 items-center justify-center rounded-full text-outline shutter-transition hover:text-primary"
          >
            <X size={16} />
          </button>
        </div>

        <div className="relative space-y-5 px-6 py-6 md:px-7 md:py-7">
          <section className="console-panel relative overflow-hidden rounded-[1.5rem] p-5 md:p-6">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent" />
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.1rem] border border-secondary/15 bg-surface-container-high/85 text-secondary">
                <ShieldCheck size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-secondary">{dict.settingsExperimentalLabel}</div>
                <h3 className="mt-2 font-headline text-xl font-bold tracking-[-0.03em] text-primary">{dict.settingsLocalSectionTitle}</h3>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">{dict.settingsLocalSectionDescription}</p>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            {workflowItems.map(({ icon: Icon, text }) => (
              <div key={text} className="rounded-[1.25rem] border border-secondary/10 bg-surface/65 p-4">
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[0.9rem] border border-secondary/15 bg-surface-container-high/80 text-secondary">
                  <Icon size={15} />
                </div>
                <p className="text-sm leading-7 text-on-surface-variant">{text}</p>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
