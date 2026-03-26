import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { defaultExifData, defaultExportSettings, demoImage, initialExportHistory, initialSessions, styleTemplates } from '../data/mockData';
import type {
  ExifData,
  ExportHistoryItem,
  ExportSettings,
  ExportStatus,
  Language,
  PreviewMode,
  SessionItem,
  StyleTemplate,
  UploadError,
  UploadStatus,
  ViewType,
  WorkspaceImage,
  WorkspaceItem,
  WorkspaceNotice,
} from '../types/app';
import { exportRenderedImage } from '../utils/export';
import { formatBytes, formatResolution } from '../utils/format';
import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE, getLocalExifFallbacks, importImageFile } from '../utils/image';

const STORAGE_KEY = 'shunyin.workspace.v2';
const MAX_SESSIONS = 6;
const MAX_EXPORTS = 12;

export interface WorkspaceState {
  currentView: ViewType;
  language: Language;
  previewMode: PreviewMode;
  selectedStyleId: StyleTemplate['id'];
  workspaceItems: WorkspaceItem[];
  selectedImageId: string;
  currentCloudWorkspaceId: string | null;
  exportSettings: ExportSettings;
  recentSessions: SessionItem[];
  exportHistory: ExportHistoryItem[];
  uploadStatus: UploadStatus;
  exportStatus: ExportStatus;
  uploadError: UploadError;
  notice: WorkspaceNotice;
}

interface PersistedWorkspaceState {
  currentView?: ViewType;
  language?: Language;
  previewMode?: PreviewMode;
  selectedStyleId?: StyleTemplate['id'];
  workspaceItems?: WorkspaceItem[];
  selectedImageId?: string;
  currentCloudWorkspaceId?: string | null;
  exifData?: ExifData;
  exportSettings?: ExportSettings;
  sourceImage?: WorkspaceImage;
  recentSessions?: SessionItem[];
  exportHistory?: ExportHistoryItem[];
}

type Action =
  | { type: 'set_view'; view: ViewType }
  | { type: 'set_language'; language: Language }
  | { type: 'set_preview_mode'; previewMode: PreviewMode }
  | { type: 'select_style'; styleId: StyleTemplate['id'] }
  | { type: 'select_image'; imageId: string }
  | { type: 'remove_image'; imageId: string }
  | { type: 'change_exif'; field: keyof ExifData; value: ExifData[keyof ExifData] }
  | { type: 'change_export_settings'; field: keyof ExportSettings; value: ExportSettings[keyof ExportSettings] }
  | { type: 'set_upload_status'; uploadStatus: UploadStatus }
  | { type: 'clear_notice' }
  | { type: 'import_started' }
  | { type: 'import_failed'; uploadError: UploadError }
  | { type: 'import_succeeded'; items: WorkspaceItem[]; selectedImageId: string; session: SessionItem }
  | { type: 'open_session'; session: SessionItem }
  | { type: 'load_session'; session: SessionItem }
  | { type: 'set_current_cloud_workspace'; workspaceId: string | null }
  | { type: 'use_demo' }
  | { type: 'export_started' }
  | { type: 'export_succeeded'; historyItems: ExportHistoryItem[] }
  | { type: 'export_failed' };

function normalizeImage(image: WorkspaceImage): WorkspaceImage {
  return {
    ...image,
    src: image.objectUrl ?? image.persistedSrc ?? image.src,
    objectUrl: undefined,
    persistedSrc: image.persistedSrc ?? image.src,
  };
}

function buildExifForImage(image: WorkspaceImage, language: Language, exifOverrides: Partial<ExifData> = {}) {
  if (image.source === 'demo') {
    return {
      ...defaultExifData,
      ...exifOverrides,
    };
  }

  const width = image.width ?? 1600;
  const height = image.height ?? 1000;
  const fallbackExif = getLocalExifFallbacks(language);

  return {
    cameraBody: exifOverrides.cameraBody ?? fallbackExif.cameraBody,
    lens: exifOverrides.lens ?? fallbackExif.lens,
    aperture: exifOverrides.aperture ?? fallbackExif.aperture,
    shutter: exifOverrides.shutter ?? fallbackExif.shutter,
    iso: exifOverrides.iso ?? fallbackExif.iso,
    colorSpace: exifOverrides.colorSpace ?? fallbackExif.colorSpace,
    bitDepth: exifOverrides.bitDepth ?? fallbackExif.bitDepth,
    metering: exifOverrides.metering ?? fallbackExif.metering,
    focusMode: exifOverrides.focusMode ?? fallbackExif.focusMode,
    fileSize: formatBytes(image.sizeBytes ?? 0, language),
    resolution: formatResolution(width, height, image.mimeType, language),
  };
}

function createWorkspaceItem(image: WorkspaceImage, language: Language, exifOverrides: Partial<ExifData> = {}): WorkspaceItem {
  return {
    id: image.id,
    image,
    exifData: buildExifForImage(image, language, exifOverrides),
  };
}

function normalizeWorkspaceItem(item: WorkspaceItem, language: Language): WorkspaceItem {
  const image = normalizeImage(item.image);
  return {
    id: item.id ?? image.id,
    image,
    exifData: buildExifForImage(image, language, item.exifData ?? defaultExifData),
  };
}

function getSessionItems(session: SessionItem, language: Language) {
  if (session.items?.length) {
    return session.items.map((item) => normalizeWorkspaceItem(item, language));
  }

  return [
    {
      id: session.image.id,
      image: normalizeImage(session.image),
      exifData: buildExifForImage(normalizeImage(session.image), language, session.exifData ?? defaultExifData),
    },
  ];
}

function normalizeSessions(sessions: SessionItem[], language: Language) {
  return sessions.slice(0, MAX_SESSIONS).map((session, index) => {
    const items = getSessionItems(session, language);
    const primaryItem = items[0] ?? createWorkspaceItem(demoImage, language, defaultExifData);

    return {
      ...session,
      featured: index === 0,
      itemCount: session.itemCount || items.length,
      coverSrc: session.coverSrc || primaryItem.image.persistedSrc || primaryItem.image.src,
      activeImageId: session.activeImageId ?? primaryItem.id,
      items,
      image: primaryItem.image,
      exifData: primaryItem.exifData,
    };
  });
}

function normalizeHistory(history: ExportHistoryItem[]) {
  return history.slice(0, MAX_EXPORTS);
}

function getActiveWorkspaceItem(workspaceItems: WorkspaceItem[], selectedImageId: string) {
  return workspaceItems.find((item) => item.id === selectedImageId) ?? workspaceItems[0];
}

function createInitialState(): WorkspaceState {
  const demoItem = createWorkspaceItem(demoImage, 'zh', defaultExifData);
  const baseState: WorkspaceState = {
    currentView: 'import',
    language: 'zh',
    previewMode: 'processed',
    selectedStyleId: styleTemplates[0].id,
    workspaceItems: [demoItem],
    selectedImageId: demoItem.id,
    currentCloudWorkspaceId: null,
    exportSettings: defaultExportSettings,
    recentSessions: normalizeSessions(initialSessions, 'zh'),
    exportHistory: normalizeHistory(initialExportHistory),
    uploadStatus: 'idle',
    exportStatus: 'idle',
    uploadError: null,
    notice: null,
  };

  if (typeof window === 'undefined') {
    return baseState;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return baseState;
    }

    const parsed = JSON.parse(raw) as PersistedWorkspaceState;
    const language = parsed.language ?? baseState.language;
    const workspaceItems = parsed.workspaceItems?.length
      ? parsed.workspaceItems.map((item) => normalizeWorkspaceItem(item, language))
      : parsed.sourceImage
        ? [createWorkspaceItem(normalizeImage(parsed.sourceImage), language, parsed.exifData ?? defaultExifData)]
        : baseState.workspaceItems;
    const selectedImageId = getActiveWorkspaceItem(workspaceItems, parsed.selectedImageId ?? workspaceItems[0]?.id ?? demoItem.id)?.id ?? demoItem.id;

    return {
      ...baseState,
      currentView: parsed.currentView ?? baseState.currentView,
      language,
      previewMode: parsed.previewMode ?? baseState.previewMode,
      selectedStyleId: parsed.selectedStyleId ?? baseState.selectedStyleId,
      workspaceItems,
      selectedImageId,
      currentCloudWorkspaceId: parsed.currentCloudWorkspaceId ?? null,
      exportSettings: {
        ...baseState.exportSettings,
        ...parsed.exportSettings,
        fileName: parsed.exportSettings?.fileName ?? getActiveWorkspaceItem(workspaceItems, selectedImageId)?.image.name ?? baseState.exportSettings.fileName,
      },
      recentSessions: parsed.recentSessions ? normalizeSessions(parsed.recentSessions, language) : baseState.recentSessions,
      exportHistory: parsed.exportHistory ? normalizeHistory(parsed.exportHistory) : baseState.exportHistory,
      uploadStatus: workspaceItems.some((item) => item.image.source === 'local') ? 'ready' : baseState.uploadStatus,
      exportStatus: 'idle',
      uploadError: null,
      notice: null,
    };
  } catch {
    return baseState;
  }
}

function persistState(state: WorkspaceState) {
  if (typeof window === 'undefined') {
    return;
  }

  const serializableState = {
    currentView: state.currentView,
    language: state.language,
    previewMode: state.previewMode,
    selectedStyleId: state.selectedStyleId,
    workspaceItems: state.workspaceItems.map((item) => ({
      ...item,
      image: normalizeImage(item.image),
    })),
    selectedImageId: state.selectedImageId,
    currentCloudWorkspaceId: state.currentCloudWorkspaceId,
    exportSettings: state.exportSettings,
    recentSessions: normalizeSessions(state.recentSessions, state.language).map((session) => ({
      ...session,
      items: session.items?.map((item) => ({
        ...item,
        image: normalizeImage(item.image),
      })),
      image: normalizeImage(session.image),
    })),
    exportHistory: normalizeHistory(state.exportHistory),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState));
  } catch {
    // Ignore storage quota issues in the demo environment.
  }
}

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case 'set_view':
      return { ...state, currentView: action.view };
    case 'set_language':
      return {
        ...state,
        language: action.language,
        workspaceItems: state.workspaceItems.map((item) => {
          const localizedExif = buildExifForImage(item.image, action.language, item.exifData);
          return {
            ...item,
            exifData: {
              ...item.exifData,
              fileSize: localizedExif.fileSize,
              resolution: localizedExif.resolution,
            },
          };
        }),
      };
    case 'set_preview_mode':
      return { ...state, previewMode: action.previewMode };
    case 'select_style':
      return { ...state, selectedStyleId: action.styleId };
    case 'select_image': {
      const nextItem = getActiveWorkspaceItem(state.workspaceItems, action.imageId);
      if (!nextItem) {
        return state;
      }

      return {
        ...state,
        selectedImageId: nextItem.id,
        exportSettings: {
          ...state.exportSettings,
          fileName: nextItem.image.name,
        },
      };
    }
    case 'remove_image': {
      const workspaceItems = state.workspaceItems.filter((item) => item.id !== action.imageId);
      if (!workspaceItems.length) {
        return state;
      }

      const selectedItem = getActiveWorkspaceItem(
        workspaceItems,
        state.selectedImageId === action.imageId ? workspaceItems[0]?.id ?? demoImage.id : state.selectedImageId,
      );

      return {
        ...state,
        workspaceItems,
        selectedImageId: selectedItem?.id ?? demoImage.id,
        exportSettings: {
          ...state.exportSettings,
          fileName: selectedItem?.image.name ?? state.exportSettings.fileName,
        },
      };
    }
    case 'set_current_cloud_workspace':
      return {
        ...state,
        currentCloudWorkspaceId: action.workspaceId,
      };
    case 'change_exif':
      return {
        ...state,
        workspaceItems: state.workspaceItems.map((item) =>
          item.id === state.selectedImageId
            ? {
                ...item,
                exifData: {
                  ...item.exifData,
                  [action.field]: action.value,
                },
              }
            : item,
        ),
      };
    case 'change_export_settings':
      return {
        ...state,
        exportSettings: {
          ...state.exportSettings,
          [action.field]: action.value,
        },
      };
    case 'set_upload_status':
      return {
        ...state,
        uploadStatus: action.uploadStatus,
        uploadError: action.uploadStatus === 'dragging' ? null : state.uploadError,
      };
    case 'clear_notice':
      return { ...state, notice: null, uploadError: null };
    case 'import_started':
      return { ...state, uploadStatus: 'loading', uploadError: null, notice: null };
    case 'import_failed':
      return { ...state, uploadStatus: 'error', uploadError: action.uploadError, notice: null };
    case 'import_succeeded': {
      const preserveExistingItems = state.currentCloudWorkspaceId
        ? state.workspaceItems
        : state.workspaceItems.filter((item) => item.image.source === 'local');
      const workspaceItems = preserveExistingItems.length ? [...preserveExistingItems, ...action.items] : action.items;
      const recentSessions = normalizeSessions(
        [action.session, ...state.recentSessions.filter((session) => session.id !== action.session.id)],
        state.language,
      );
      const selectedItem = getActiveWorkspaceItem(workspaceItems, action.selectedImageId) ?? workspaceItems[0];

      return {
        ...state,
        workspaceItems,
        selectedImageId: selectedItem?.id ?? action.selectedImageId,
        exportSettings: {
          ...state.exportSettings,
          fileName: selectedItem?.image.name ?? state.exportSettings.fileName,
        },
        currentCloudWorkspaceId: state.currentCloudWorkspaceId,
        recentSessions,
        currentView: 'editor',
        previewMode: 'processed',
        uploadStatus: 'ready',
        exportStatus: 'idle',
        uploadError: null,
        notice: 'import_ready',
      };
    }
    case 'open_session': {
      const sessionItems = getSessionItems(action.session, state.language);
      const selectedItem = getActiveWorkspaceItem(sessionItems, action.session.activeImageId ?? sessionItems[0]?.id ?? demoImage.id);
      return {
        ...state,
        workspaceItems: sessionItems,
        selectedImageId: selectedItem?.id ?? demoImage.id,
        exportSettings: {
          ...state.exportSettings,
          fileName: selectedItem?.image.name ?? state.exportSettings.fileName,
        },
        currentCloudWorkspaceId: action.session.cloudWorkspaceId ?? null,
        currentView: 'editor',
        previewMode: 'processed',
        uploadStatus: selectedItem?.image.source === 'local' ? 'ready' : 'idle',
        uploadError: null,
        notice: null,
      };
    }
    case 'load_session': {
      const sessionItems = getSessionItems(action.session, state.language);
      const selectedItem = getActiveWorkspaceItem(sessionItems, action.session.activeImageId ?? sessionItems[0]?.id ?? demoImage.id);
      return {
        ...state,
        workspaceItems: sessionItems,
        selectedImageId: selectedItem?.id ?? demoImage.id,
        exportSettings: {
          ...state.exportSettings,
          fileName: selectedItem?.image.name ?? state.exportSettings.fileName,
        },
        currentCloudWorkspaceId: action.session.cloudWorkspaceId ?? null,
        currentView: 'editor',
        previewMode: 'processed',
        uploadStatus: selectedItem?.image.source === 'local' ? 'ready' : 'idle',
        uploadError: null,
        notice: null,
      };
    }
    case 'use_demo': {
      const demoItem = createWorkspaceItem(demoImage, state.language, defaultExifData);
      return {
        ...state,
        workspaceItems: [demoItem],
        selectedImageId: demoItem.id,
        currentCloudWorkspaceId: null,
        exportSettings: defaultExportSettings,
        currentView: 'editor',
        previewMode: 'processed',
        uploadStatus: 'idle',
        uploadError: null,
        notice: null,
      };
    }
    case 'export_started':
      return { ...state, exportStatus: 'rendering', notice: null };
    case 'export_succeeded':
      return {
        ...state,
        exportStatus: 'done',
        exportHistory: normalizeHistory([...action.historyItems, ...state.exportHistory]),
        currentView: 'export',
        notice: 'export_done',
      };
    case 'export_failed':
      return { ...state, exportStatus: 'error', notice: 'export_failed' };
    default:
      return state;
  }
}

export function useWorkspaceState() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());

  const activeItem = useMemo(
    () => getActiveWorkspaceItem(state.workspaceItems, state.selectedImageId) ?? createWorkspaceItem(demoImage, state.language, defaultExifData),
    [state.language, state.selectedImageId, state.workspaceItems],
  );

  useEffect(() => {
    persistState(state);
  }, [state]);

  const revokeTrackedObjectUrls = useCallback(() => {
    for (const url of objectUrlsRef.current.values()) {
      URL.revokeObjectURL(url);
    }
    objectUrlsRef.current.clear();
  }, []);

  useEffect(() => () => {
    revokeTrackedObjectUrls();
  }, [revokeTrackedObjectUrls]);

  const setCurrentView = useCallback((view: ViewType) => {
    dispatch({ type: 'set_view', view });
  }, []);

  const setLanguage = useCallback((language: Language) => {
    dispatch({ type: 'set_language', language });
  }, []);

  const setPreviewMode = useCallback((previewMode: PreviewMode) => {
    dispatch({ type: 'set_preview_mode', previewMode });
  }, []);

  const selectStyle = useCallback((styleId: StyleTemplate['id']) => {
    dispatch({ type: 'select_style', styleId });
  }, []);

  const selectImage = useCallback((imageId: string) => {
    dispatch({ type: 'select_image', imageId });
  }, []);

  const removeImage = useCallback((imageId: string) => {
    dispatch({ type: 'remove_image', imageId });
  }, []);

  const changeExif = useCallback(<K extends keyof ExifData>(field: K, value: ExifData[K]) => {
    dispatch({ type: 'change_exif', field, value });
  }, []);

  const changeExportSettings = useCallback(<K extends keyof ExportSettings>(field: K, value: ExportSettings[K]) => {
    dispatch({ type: 'change_export_settings', field, value });
  }, []);

  const setUploadStatus = useCallback((uploadStatus: UploadStatus) => {
    dispatch({ type: 'set_upload_status', uploadStatus });
  }, []);

  const clearNotice = useCallback(() => {
    dispatch({ type: 'clear_notice' });
  }, []);

  const importFiles = useCallback(
    async (files: File[]) => {
      if (!files.length) {
        return;
      }

      if (files.some((file) => !ACCEPTED_IMAGE_TYPES.includes(file.type))) {
        dispatch({ type: 'import_failed', uploadError: 'invalid_type' });
        return;
      }

      if (files.some((file) => file.size > MAX_FILE_SIZE)) {
        dispatch({ type: 'import_failed', uploadError: 'file_too_large' });
        return;
      }

      dispatch({ type: 'import_started' });

      const importedItems: WorkspaceItem[] = [];
      const createdUrls: Array<{ id: string; url: string }> = [];

      try {
        for (const file of files) {
          const objectUrl = URL.createObjectURL(file);
          const imported = await importImageFile(file, objectUrl, state.language);
          const item = createWorkspaceItem(imported.image, state.language, imported.exifOverrides);

          importedItems.push(item);
          createdUrls.push({ id: item.id, url: objectUrl });
        }

        for (const entry of createdUrls) {
          objectUrlsRef.current.set(entry.id, entry.url);
        }

        const firstItem = importedItems[0];
        const batchTitle = importedItems.length > 1 ? `${firstItem?.image.name} +${importedItems.length - 1}` : firstItem?.image.name ?? 'session';

        const session: SessionItem = {
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
        };

        dispatch({
          type: 'import_succeeded',
          items: importedItems,
          selectedImageId: firstItem?.id ?? demoImage.id,
          session,
        });
      } catch {
        for (const entry of createdUrls) {
          URL.revokeObjectURL(entry.url);
        }
        dispatch({ type: 'import_failed', uploadError: 'import_failed' });
      }
    },
    [state.language],
  );

  const openSession = useCallback((sessionId: string) => {
    const session = state.recentSessions.find((item) => item.id === sessionId);
    if (!session) {
      return;
    }

    revokeTrackedObjectUrls();
    dispatch({ type: 'open_session', session });
  }, [revokeTrackedObjectUrls, state.recentSessions]);

  const useDemoImage = useCallback(() => {
    revokeTrackedObjectUrls();
    dispatch({ type: 'use_demo' });
  }, [revokeTrackedObjectUrls]);

  const loadSession = useCallback((session: SessionItem) => {
    dispatch({ type: 'load_session', session });
  }, []);

  const setCurrentCloudWorkspace = useCallback((workspaceId: string | null) => {
    dispatch({ type: 'set_current_cloud_workspace', workspaceId });
  }, []);

  const exportCurrent = useCallback(
    async (selectedStyle: StyleTemplate, styleTitle: string, brandName: string) => {
      dispatch({ type: 'export_started' });

      try {
        const result = await exportRenderedImage({
          image: activeItem.image,
          exifData: activeItem.exifData,
          exportSettings: state.exportSettings,
          selectedStyle,
          styleTitle,
          brandName,
        });

        dispatch({
          type: 'export_succeeded',
          historyItems: [
            {
              id: `export-${Date.now()}`,
              fileName: result.fileName,
              styleId: selectedStyle.id,
              format: state.exportSettings.format,
              quality: state.exportSettings.quality,
              createdAt: new Date().toISOString(),
              status: 'downloaded',
              previewSrc: result.previewSrc,
            },
          ],
        });
      } catch {
        dispatch({ type: 'export_failed' });
      }
    },
    [activeItem, state.exportSettings],
  );

  const exportAll = useCallback(
    async (selectedStyle: StyleTemplate, styleTitle: string, brandName: string) => {
      dispatch({ type: 'export_started' });

      try {
        const historyItems: ExportHistoryItem[] = [];

        for (const item of state.workspaceItems) {
          const exportSettings = {
            ...state.exportSettings,
            fileName: state.workspaceItems.length === 1 && item.id === state.selectedImageId
              ? state.exportSettings.fileName
              : item.image.name,
          };

          const result = await exportRenderedImage({
            image: item.image,
            exifData: item.exifData,
            exportSettings,
            selectedStyle,
            styleTitle,
            brandName,
          });

          historyItems.push({
            id: `export-${item.id}-${Date.now()}-${historyItems.length}`,
            fileName: result.fileName,
            styleId: selectedStyle.id,
            format: exportSettings.format,
            quality: exportSettings.quality,
            createdAt: new Date().toISOString(),
            status: 'downloaded',
            previewSrc: result.previewSrc,
          });
        }

        dispatch({ type: 'export_succeeded', historyItems });
      } catch {
        dispatch({ type: 'export_failed' });
      }
    },
    [state.exportSettings, state.selectedImageId, state.workspaceItems],
  );

  return {
    state: {
      ...state,
      sourceImage: activeItem.image,
      exifData: activeItem.exifData,
    },
    actions: {
      setCurrentView,
      setLanguage,
      setPreviewMode,
      selectStyle,
      selectImage,
      removeImage,
      changeExif,
      changeExportSettings,
      setUploadStatus,
      clearNotice,
      importFiles,
      openSession,
      loadSession,
      setCurrentCloudWorkspace,
      useDemoImage,
      exportCurrent,
      exportAll,
    },
  };
}
