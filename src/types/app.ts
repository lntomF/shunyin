import type { TranslationKey } from '../i18n/translations';

export type Language = 'en' | 'zh';

export type ViewType = 'import' | 'editor' | 'styles' | 'export';

export type PreviewMode = 'original' | 'processed';

export type UploadStatus = 'idle' | 'dragging' | 'loading' | 'ready' | 'error';

export type ExportStatus = 'idle' | 'rendering' | 'done' | 'error';

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous';
export type CloudSyncStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'error' | 'disabled';

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
  storageOriginalPath?: string;
  storagePreviewPath?: string;
  objectUrl?: string;
  width?: number;
  height?: number;
  sizeBytes?: number;
  mimeType?: string;
  source: 'demo' | 'local' | 'cloud';
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
  source: 'demo' | 'local' | 'cloud';
  cloudWorkspaceId?: string;
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

export interface ProfileRecord {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}
