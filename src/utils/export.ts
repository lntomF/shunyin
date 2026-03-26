import type { ExifData, ExportSettings, StyleTemplate, WorkspaceImage } from '../types/app';
import { sanitizeFileName } from './format';
import { loadImageElement, createScaledDataUrl } from './image';
import { createOverlayDataUrl, getRenderedOverlaySize } from './overlay';

interface ExportRenderedImageOptions {
  image: WorkspaceImage;
  exifData: ExifData;
  exportSettings: ExportSettings;
  selectedStyle: StyleTemplate;
  styleTitle: string;
  brandName: string;
}

function mapQuality(quality: ExportSettings['quality']) {
  if (quality === 'web') {
    return 0.72;
  }

  if (quality === 'max') {
    return 0.96;
  }

  return 0.86;
}

export async function exportRenderedImage({ image, exifData, exportSettings, selectedStyle, styleTitle, brandName }: ExportRenderedImageOptions) {
  const source = image.objectUrl ?? image.src;
  const baseImage = await loadImageElement(source);
  const width = image.width ?? baseImage.naturalWidth ?? 1600;
  const height = image.height ?? baseImage.naturalHeight ?? 1000;
  const renderedSize = getRenderedOverlaySize(selectedStyle, width, height);
  const overlaySrc = await createOverlayDataUrl({
    width,
    height,
    image,
    exifData,
    styleTemplate: selectedStyle,
    styleTitle,
    brandName,
  });
  const overlayImage = await loadImageElement(overlaySrc);

  const canvas = document.createElement('canvas');
  canvas.width = renderedSize.width;
  canvas.height = renderedSize.height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas unavailable.');
  }

  context.drawImage(overlayImage, 0, 0, renderedSize.width, renderedSize.height);

  const mimeType = exportSettings.format === 'PNG' ? 'image/png' : 'image/jpeg';
  const fileName = `${sanitizeFileName(exportSettings.fileName)}.${exportSettings.format.toLowerCase()}`;
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mimeType, mapQuality(exportSettings.quality));
  });

  if (!blob) {
    throw new Error('Failed to generate export blob.');
  }

  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(downloadUrl);

  const previewSrc = await createScaledDataUrl(canvas.toDataURL(mimeType, mapQuality(exportSettings.quality)), 720, 'image/jpeg', 0.84);

  return {
    fileName,
    previewSrc,
  };
}
