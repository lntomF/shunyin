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
      <div className="relative h-[68px] w-full overflow-hidden">
        <MatrixMorphCanvas imageSrc={imageSrc} />
      </div>
    </div>
  );
}
