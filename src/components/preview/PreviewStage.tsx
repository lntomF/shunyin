import { useEffect, useMemo, useRef, useState } from 'react';
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
  const [overlaySrc, setOverlaySrc] = useState<string | null>(null);
  const renderSerialRef = useRef(0);
  const lastRenderContextRef = useRef<string | null>(null);
  const renderContext = `${previewMode}:${image.id}:${image.objectUrl ?? image.src}:${styleTemplate.id}:${styleTitle}:${brandName}:${width}x${height}`;

  useEffect(() => {
    if (previewMode !== 'processed') {
      setOverlaySrc(null);
      lastRenderContextRef.current = null;
      return;
    }

    let active = true;
    const renderSerial = renderSerialRef.current + 1;
    const isNewRenderContext = lastRenderContextRef.current !== renderContext;
    const renderDelay = isNewRenderContext ? 0 : 360;

    renderSerialRef.current = renderSerial;
    lastRenderContextRef.current = renderContext;

    if (isNewRenderContext) {
      setOverlaySrc(null);
    }

    const renderTimer = window.setTimeout(() => {
      createOverlayDataUrl({
        width,
        height,
        image,
        exifData,
        styleTemplate,
        styleTitle,
        brandName,
      })
        .then((nextOverlaySrc) => {
          if (active && renderSerialRef.current === renderSerial) {
            setOverlaySrc(nextOverlaySrc);
          }
        })
        .catch(() => {
          if (active && renderSerialRef.current === renderSerial) {
            setOverlaySrc(null);
          }
        });
    }, renderDelay);

    return () => {
      active = false;
      window.clearTimeout(renderTimer);
    };
  }, [brandName, exifData, height, image, previewMode, renderContext, styleTemplate, styleTitle, width]);

  if (previewMode === 'processed') {
    return (
      <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${renderedSize.width} / ${renderedSize.height}` }}>
        <img
          src={overlaySrc ?? (image.objectUrl ?? image.src)}
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
