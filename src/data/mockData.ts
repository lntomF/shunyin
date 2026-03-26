import demoPhoto from '../assets/demo-photo.svg';
import type { ExportHistoryItem, ExifData, ExportSettings, SessionItem, StyleTemplate, WorkspaceImage } from '../types/app';

const demoTimestamp = new Date('2026-03-25T18:30:00.000Z').toISOString();

export const demoImage: WorkspaceImage = {
  id: 'img-demo',
  name: 'shunyin_demo_frame',
  src: demoPhoto,
  persistedSrc: demoPhoto,
  width: 1600,
  height: 1066,
  sizeBytes: 420000,
  mimeType: 'image/svg+xml',
  source: 'demo',
  createdAt: demoTimestamp,
};

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
  fileName: 'shunyin_demo_frame',
  format: 'JPG',
  quality: 'standard',
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

export const initialSessions: SessionItem[] = [
  {
    id: 'session-demo-1',
    title: 'Industrial Texture 01',
    coverSrc: demoPhoto,
    updatedAt: new Date('2026-03-25T18:20:00.000Z').toISOString(),
    itemCount: 24,
    source: 'demo',
    featured: true,
    exifData: defaultExifData,
    image: {
      ...demoImage,
      id: 'img-demo-1',
      name: 'industrial_texture_01',
      createdAt: new Date('2026-03-25T18:20:00.000Z').toISOString(),
    },
  },
  {
    id: 'session-demo-2',
    title: 'Nocturne Alley',
    coverSrc: demoPhoto,
    updatedAt: new Date('2026-03-25T17:45:00.000Z').toISOString(),
    itemCount: 12,
    source: 'demo',
    exifData: defaultExifData,
    image: {
      ...demoImage,
      id: 'img-demo-2',
      name: 'nocturne_alley',
      createdAt: new Date('2026-03-25T17:45:00.000Z').toISOString(),
    },
  },
  {
    id: 'session-demo-3',
    title: 'Terminal Echo',
    coverSrc: demoPhoto,
    updatedAt: new Date('2026-03-25T17:10:00.000Z').toISOString(),
    itemCount: 8,
    source: 'demo',
    exifData: defaultExifData,
    image: {
      ...demoImage,
      id: 'img-demo-3',
      name: 'terminal_echo',
      createdAt: new Date('2026-03-25T17:10:00.000Z').toISOString(),
    },
  },
  {
    id: 'session-demo-4',
    title: 'City Drift',
    coverSrc: demoPhoto,
    updatedAt: new Date('2026-03-25T16:45:00.000Z').toISOString(),
    itemCount: 6,
    source: 'demo',
    exifData: defaultExifData,
    image: {
      ...demoImage,
      id: 'img-demo-4',
      name: 'city_drift',
      createdAt: new Date('2026-03-25T16:45:00.000Z').toISOString(),
    },
  },
];

export const initialExportHistory: ExportHistoryItem[] = [
  {
    id: 'export-demo-1',
    fileName: 'shunyin_demo_frame.jpg',
    styleId: 'portrait-gallery-card',
    format: 'JPG',
    quality: 'standard',
    createdAt: new Date('2026-03-25T18:28:00.000Z').toISOString(),
    status: 'ready',
    previewSrc: demoPhoto,
  },
];
