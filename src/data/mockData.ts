import type { ExifData, ExportSettings, StyleTemplate } from '../types/app';

export const defaultExifData: ExifData = {
  cameraBody: 'Sony A7R IV',
  watermarkTitle: 'SHUNYIN',
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
    id: 'minimal-white-footer',
    titleKey: 'tpl1Title',
    descriptionKey: 'tpl1Desc',
    styleType: 'minimal-white-footer',
  },
  {
    id: 'magazine-cover',
    titleKey: 'tpl2Title',
    descriptionKey: 'tpl2Desc',
    styleType: 'magazine-cover',
  },
  {
    id: 'film-border',
    titleKey: 'tpl3Title',
    descriptionKey: 'tpl3Desc',
    styleType: 'film-border',
  },
];
