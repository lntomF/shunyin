import { createElement, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PortraitGalleryCardTemplate } from '../components/watermark/PortraitGalleryCardTemplate';
import { WhiteFooterBrandTemplate } from '../components/watermark/WhiteFooterBrandTemplate';
import type { WatermarkSvgProps } from '../components/watermark/types';
import type { ExifData, StyleTemplate, WorkspaceImage } from '../types/app';
import { resolveImageDataUrl } from './image';

interface OverlayOptions {
  width: number;
  height: number;
  image: WorkspaceImage;
  exifData: ExifData;
  styleTemplate: StyleTemplate;
  styleTitle: string;
  brandName: string;
}

interface RenderedSize {
  width: number;
  height: number;
}

const WATERMARK_RENDERERS: Record<StyleTemplate['styleType'], (props: WatermarkSvgProps) => ReactElement> = {
  'portrait-gallery-card': PortraitGalleryCardTemplate,
  'white-footer-brand': WhiteFooterBrandTemplate,
};

function compactValue(value: string) {
  const trimmed = value.trim();
  return trimmed && trimmed !== '--' ? trimmed : undefined;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const WATERMARK_LAYOUT_BASELINE = 1600;

export function getWatermarkLayoutScale(sourceWidth: number, sourceHeight: number) {
  return Math.max(Math.max(sourceWidth, sourceHeight) / WATERMARK_LAYOUT_BASELINE, 1);
}

function getScaledMax(maxValue: number, scale: number) {
  return Math.round(maxValue * scale);
}

function buildCameraTitle(exifData: ExifData) {
  return compactValue(exifData.cameraBody) ?? 'Camera';
}

function buildBrandLabel(exifData: ExifData, fallbackBrandName: string) {
  const cameraTitle = buildCameraTitle(exifData);
  const firstToken = cameraTitle.split(/\s+/)[0];
  return compactValue(firstToken) ?? fallbackBrandName;
}

function extractFocalLength(lens: string) {
  const normalizedLens = compactValue(lens);
  if (!normalizedLens) {
    return undefined;
  }

  const match = normalizedLens.match(/(\d+(?:\.\d+)?(?:\s*-\s*\d+(?:\.\d+)?)?)\s*mm/i);
  if (!match) {
    return undefined;
  }

  return `${match[1].replace(/\s+/g, '')}mm`;
}

function normalizeIso(value: string) {
  const trimmed = compactValue(value);
  if (!trimmed) {
    return undefined;
  }

  return /^iso/i.test(trimmed) ? trimmed.replace(/\s+/gi, '').toUpperCase() : `ISO${trimmed}`;
}

function buildParameterLine(exifData: ExifData) {
  const values = [
    extractFocalLength(exifData.lens),
    compactValue(exifData.aperture),
    compactValue(exifData.shutter),
    normalizeIso(exifData.iso),
  ].filter((value): value is string => Boolean(value));

  return values.join(' ') || compactValue(exifData.lens) || '--';
}

function formatCaptureTime(isoDate: string) {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '--';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}:${month}:${day} ${hours}:${minutes}:${String(date.getSeconds()).padStart(2, '0')}`;
}

export function getRenderedOverlaySize(styleTemplate: StyleTemplate, sourceWidth: number, sourceHeight: number): RenderedSize {
  const layoutScale = getWatermarkLayoutScale(sourceWidth, sourceHeight);

  switch (styleTemplate.styleType) {
    case 'portrait-gallery-card': {
      const minEdge = Math.min(sourceWidth, sourceHeight);
      const sidePadding = clamp(Math.round(minEdge * 0.12), 44, getScaledMax(140, layoutScale));
      const topPadding = clamp(Math.round(minEdge * 0.08), 28, getScaledMax(96, layoutScale));
      const footerHeight = clamp(Math.round(minEdge * 0.2), 110, getScaledMax(220, layoutScale));

      return {
        width: sourceWidth + sidePadding * 2,
        height: sourceHeight + topPadding + footerHeight,
      };
    }
    case 'white-footer-brand': {
      const footerHeight = clamp(Math.round(sourceHeight * 0.17), 108, getScaledMax(176, layoutScale));
      return {
        width: sourceWidth,
        height: sourceHeight + footerHeight,
      };
    }
    default:
      return { width: sourceWidth, height: sourceHeight };
  }
}

function buildOverlaySvgMarkup(
  { width, height, image, exifData, styleTemplate, styleTitle, brandName }: OverlayOptions,
  imageHref: string,
) {
  const Renderer = WATERMARK_RENDERERS[styleTemplate.styleType];
  const renderedSize = getRenderedOverlaySize(styleTemplate, width, height);

  return renderToStaticMarkup(
    createElement(Renderer, {
      width: renderedSize.width,
      height: renderedSize.height,
      image,
      imageHref,
      exifData,
      styleTitle,
      brandName,
      captureTimeText: formatCaptureTime(image.createdAt),
      cameraTitle: buildCameraTitle(exifData),
      brandLabel: buildBrandLabel(exifData, brandName),
      parameterLine: buildParameterLine(exifData),
    }),
  );
}

async function resolveOverlayImageHref(image: WorkspaceImage) {
  const candidate = image.persistedSrc ?? image.objectUrl ?? image.src;
  return resolveImageDataUrl(candidate);
}

export async function buildOverlaySvg(options: OverlayOptions) {
  const imageHref = await resolveOverlayImageHref(options.image);
  return buildOverlaySvgMarkup(options, imageHref);
}

export async function createOverlayDataUrl(options: OverlayOptions) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(await buildOverlaySvg(options))}`;
}

