import { defaultExifData, demoImage } from '../data/mockData';
import type {
  ExportHistoryItem,
  ExportSettings,
  Language,
  SessionItem,
  StyleTemplate,
  UploadError,
  WorkspaceItem,
} from '../types/app';
import { exportRenderedImage } from '../utils/export';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE, importImageFile } from '../utils/image';
import { saveLocalImageBlob } from '../utils/localImageStore';
import { createWorkspaceItem, normalizeImage } from './workspaceState';

interface ImportedWorkspaceFilesResult {
  importedItems: WorkspaceItem[];
  createdObjectUrls: Array<{ id: string; url: string }>;
  session: SessionItem;
}

interface ExportWorkspaceItemOptions {
  item: WorkspaceItem;
  exportSettings: ExportSettings;
  selectedStyle: StyleTemplate;
  styleTitle: string;
  brandName: string;
}

interface ExportWorkspaceBatchOptions {
  items: WorkspaceItem[];
  selectedImageId: string;
  exportSettings: ExportSettings;
  selectedStyle: StyleTemplate;
  styleTitle: string;
  brandName: string;
}

export function validateImportFiles(files: File[]): UploadError {
  if (files.some((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type))) {
    return 'invalid_type';
  }

  if (files.some((file) => file.size > MAX_FILE_SIZE)) {
    return 'file_too_large';
  }

  return null;
}

export async function importWorkspaceFiles(files: File[], language: Language): Promise<ImportedWorkspaceFilesResult> {
  const importedItems: WorkspaceItem[] = [];
  const createdObjectUrls: Array<{ id: string; url: string }> = [];

  for (const file of files) {
    const objectUrl = URL.createObjectURL(file);
    const imported = await importImageFile(file, objectUrl, language);
    const item = createWorkspaceItem(imported.image, language, imported.exifOverrides);

    importedItems.push(item);
    createdObjectUrls.push({ id: item.id, url: objectUrl });

    await saveLocalImageBlob(item.id, file).catch(() => {
      // Ignore IndexedDB failures and keep the current session usable in memory.
    });
  }

  const firstItem = importedItems[0];
  const batchTitle = importedItems.length > 1 ? `${firstItem?.image.name} +${importedItems.length - 1}` : firstItem?.image.name ?? 'session';

  return {
    importedItems,
    createdObjectUrls,
    session: {
      id: `session-${Date.now()}`,
      title: batchTitle,
      coverSrc: firstItem?.image.persistedSrc ?? firstItem?.image.src ?? demoImage.src,
      updatedAt: firstItem?.image.createdAt ?? new Date().toISOString(),
      itemCount: importedItems.length,
      source: 'local',
      activeImageId: firstItem?.id,
      items: importedItems.map((item) => ({
        ...item,
        image: normalizeImage(item.image),
      })),
      image: normalizeImage(firstItem?.image ?? demoImage),
      exifData: firstItem?.exifData ?? defaultExifData,
    },
  };
}

async function renderWorkspaceItem({ item, exportSettings, selectedStyle, styleTitle, brandName }: ExportWorkspaceItemOptions) {
  return exportRenderedImage({
    image: item.image,
    exifData: item.exifData,
    exportSettings,
    selectedStyle,
    styleTitle,
    brandName,
  });
}

export async function exportCurrentWorkspaceItem(options: ExportWorkspaceItemOptions): Promise<ExportHistoryItem[]> {
  const result = await renderWorkspaceItem(options);

  return [
    {
      id: `export-${Date.now()}`,
      fileName: result.fileName,
      styleId: options.selectedStyle.id,
      format: options.exportSettings.format,
      quality: options.exportSettings.quality,
      createdAt: new Date().toISOString(),
      status: 'downloaded',
      previewSrc: result.previewSrc,
    },
  ];
}

export async function exportWorkspaceBatch({
  items,
  selectedImageId,
  exportSettings,
  selectedStyle,
  styleTitle,
  brandName,
}: ExportWorkspaceBatchOptions): Promise<ExportHistoryItem[]> {
  const historyItems: ExportHistoryItem[] = [];

  for (const item of items) {
    const nextExportSettings = {
      ...exportSettings,
      fileName: items.length === 1 && item.id === selectedImageId
        ? exportSettings.fileName
        : item.image.name,
    };

    const result = await renderWorkspaceItem({
      item,
      exportSettings: nextExportSettings,
      selectedStyle,
      styleTitle,
      brandName,
    });

    historyItems.push({
      id: `export-${item.id}-${Date.now()}-${historyItems.length}`,
      fileName: result.fileName,
      styleId: selectedStyle.id,
      format: nextExportSettings.format,
      quality: nextExportSettings.quality,
      createdAt: new Date().toISOString(),
      status: 'downloaded',
      previewSrc: result.previewSrc,
    });
  }

  return historyItems;
}
