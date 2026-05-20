import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
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
        .catch((error) => {
          console.error('水印渲染失败:', error);
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
        <motion.img
          key={`${renderContext}:${overlaySrc ? 'overlay' : 'source'}`}
          initial={{ opacity: 0, scale: 0.985, filter: 'blur(10px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
          src={overlaySrc ?? (image.objectUrl ?? image.src)}
          alt={alt}
          className={`h-full w-full object-contain shadow-[0_28px_80px_rgba(0,0,0,0.32)] transition-transform duration-700 ${imageClassName} ${overlayClassName}`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ aspectRatio: `${width} / ${height}` }}>
      <motion.img
        key={`${image.id}:${image.objectUrl ?? image.src}:original`}
        initial={{ opacity: 0, scale: 0.985, filter: 'blur(10px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.46, ease: [0.16, 1, 0.3, 1] }}
        src={image.objectUrl ?? image.src}
        alt={alt}
        className={`h-full w-full object-cover opacity-100 shadow-[0_28px_80px_rgba(0,0,0,0.32)] transition-transform duration-700 ${imageClassName}`}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
