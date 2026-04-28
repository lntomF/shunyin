import type { ExifData, ExportSettings, StyleTemplate } from '../types/app';

export const defaultExifData: ExifData = {
  cameraBody: 'Sony A7R IV',
  lens: 'FE 35mm f/1.4 GM',
  aperture: 'f/1.4',
  shutter: '1/2500',
  iso: '100',
  colorSpace: 'Adobe RGB (1998)',
  bitDepth: '14-bit Uncompressed',
  metering: 'Multi-segment',
  fileSize: '410 KB',
  focusMode: 'AF-C ACTIVE',
  resolution: 'SVG • 1.7 MP • 1600 × 1066',
};

export const defaultExportSettings: ExportSettings = {
  fileName: 'shunyin_export',
  format: 'JPG',
  quality: 'max',
};

export const styleTemplates: StyleTemplate[] = [
  {
    id: 'portrait-gallery-card',
    titleKey: 'tpl1Title',
    descriptionKey: 'tpl1Desc',
    styleType: 'portrait-gallery-card',
  },
  {
    id: 'white-footer-brand',
    titleKey: 'tpl2Title',
    descriptionKey: 'tpl2Desc',
    styleType: 'white-footer-brand',
  },
];
