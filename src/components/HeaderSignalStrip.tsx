import type { Dictionary } from '../i18n/translations';
import type { WorkspaceImage } from '../types/app';
import { MatrixMorphCanvas } from './MatrixMorphCanvas';

interface HeaderSignalStripProps {
  dict: Dictionary;
  sourceImage: WorkspaceImage;
}

export function HeaderSignalStrip({ dict, sourceImage }: HeaderSignalStripProps) {
  const imageSrc = sourceImage.objectUrl ?? sourceImage.src;

  return (
    <div className="hidden min-w-0 flex-1 lg:block">
      <div className="relative h-[68px] w-full overflow-hidden rounded-[1.15rem] border border-secondary/12 bg-[#060b17]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/65 to-transparent" />
        <MatrixMorphCanvas imageSrc={imageSrc} />

        <div className="pointer-events-none absolute left-4 top-2 z-10">
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-secondary">{dict.homeHeroMatrixLabel}</div>
        </div>
        <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2">
          <div className="font-mono text-[7px] uppercase tracking-[0.18em] text-secondary/75">{dict.homeHeroBeamLabel}</div>
        </div>
        <div className="pointer-events-none absolute right-4 top-2 z-10 text-right">
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-secondary">{dict.homeHeroPhotoLabel}</div>
          <div className="mt-0.5 text-[8px] uppercase tracking-[0.12em] text-on-surface-variant">{sourceImage.name}</div>
        </div>
      </div>
    </div>
  );
}
