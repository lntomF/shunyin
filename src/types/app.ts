import type { TranslationKey } from '../i18n/translations';

export type Language = 'en' | 'zh';

export type ViewType = 'import' | 'editor' | 'styles' | 'export';

export type PreviewMode = 'original' | 'processed';

export type UploadStatus = 'idle' | 'dragging' | 'loading' | 'ready' | 'error';

export type ExportStatus = 'idle' | 'rendering' | 'done' | 'error';

export type UploadError = 'invalid_type' | 'file_too_large' | 'import_failed' | null;

export type WorkspaceNotice = 'import_ready' | 'export_done' | 'export_failed' | null;

export interface ExifData {
  cameraBody: string;
  lens: string;
  aperture: string;
  shutter: string;
  iso: string;
  colorSpace: string;
  bitDepth: string;
  metering: string;
  fileSize: string;
  focusMode: string;
  resolution: string;
}

export interface StyleTemplate {
  id: string;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  styleType: 'portrait-gallery-card' | 'white-footer-brand';
}

export interface ExportSettings {
  fileName: string;
  format: 'JPG' | 'PNG';
  quality: 'web' | 'standard' | 'max';
}

export interface WorkspaceImage {
  id: string;
  name: string;
  src: string;
  persistedSrc?: string;
  objectUrl?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
  source: 'demo' | 'local';
  createdAt: string;
}

export interface WorkspaceItem {
  id: string;
  image: WorkspaceImage;
  exifData: ExifData;
}

export interface SessionItem {
  id: string;
  title: string;
  coverSrc: string;
  updatedAt: string;
  itemCount: number;
  source: 'demo' | 'local';
  items?: WorkspaceItem[];
  activeImageId?: string;
  image: WorkspaceImage;
  exifData: ExifData;
  featured?: boolean;
}

export interface ExportHistoryItem {
  id: string;
  fileName: string;
  styleId: string;
  format: 'JPG' | 'PNG';
  quality: 'web' | 'standard' | 'max';
  createdAt: string;
  status: 'ready' | 'downloaded';
  previewSrc: string;
}
