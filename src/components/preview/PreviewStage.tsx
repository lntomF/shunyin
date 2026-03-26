import { useMemo } from 'react';
import type { ExifData, PreviewMode, StyleTemplate, WorkspaceImage } from '../../types/app';
import { createOverlayDataUrl, getRenderedOverlaySize } from '../../utils/overlay';

interface PreviewStageProps {
  image: WorkspaceImage;
  exifData: ExifData;
  styleTemplate: StyleTemplate;
  styleTitle: string;
  brandName: string;
  previewMode: PreviewMode;
  alt: string;
  className?: string;
  imageClassName?: string;
  overlayClassName?: string;
}

export function PreviewStage({
  image,
  exifData,
  styleTemplate,
  styleTitle,
  brandName,
  previewMode,
  alt,
  className = '',
  imageClassName = '',
  overlayClassName = '',
}: PreviewStageProps) {
  const width = image.width ?? 1600;
  const height = image.height ?? 1066;
  const renderedSize = useMemo(() => getRenderedOverlaySize(styleTemplate, width, height), [height, styleTemplate, width]);
  const overlaySrc = useMemo(
    () =>
      createOverlayDataUrl({
        width,
        height,
        image,
        exifData,
        styleTemplate,
        styleTitle,
        brandName,
      }),
    [brandName, exifData, height, image, styleTemplate, styleTitle, width],
  );

  if (previewMode === 'processed') {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${renderedSize.width} / ${renderedSize.height}` }}>
        <img
          src={overlaySrc}
          alt={alt}
          className={`h-full w-full object-contain transition-transform duration-700 ${imageClassName} ${overlayClassName}`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <img
        src={image.objectUrl ?? image.src}
        alt={alt}
        className={`h-full w-full object-cover transition-transform duration-700 opacity-100 ${imageClassName}`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
