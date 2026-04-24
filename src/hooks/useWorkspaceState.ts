import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type { ExifData, ExportSettings, Language, PreviewMode, SessionItem, StyleTemplate, Theme, UploadStatus, ViewType } from '../types/app';
import { getLocalImageBlobs } from '../utils/localImageStore';
import {
  createInitialState,
  createWorkspaceItem,
  getActiveWorkspaceItem,
  persistState,
  type WorkspaceState,
  workspaceReducer,
} from '../services/workspaceState';
import {
  exportCurrentWorkspaceItem,
  exportWorkspaceBatch,
  importWorkspaceFiles,
  validateImportFiles,
} from '../services/workspaceService';

export function useWorkspaceState() {
  const [state, dispatch] = useReducer(workspaceReducer, undefined, createInitialState);
  const objectUrlsRef = useRef<Map<string, string>>(new Map());
  const missingLocalImageIdsRef = useRef<Set<string>>(new Set());

  const activeItem = useMemo(
    () => getActiveWorkspaceItem(state.workspaceItems, state.selectedImageId) ?? null,
    [state.selectedImageId, state.workspaceItems],
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

  const trackObjectUrl = useCallback((id: string, url: string) => {
    const previousUrl = objectUrlsRef.current.get(id);
    if (previousUrl && previousUrl !== url) {
      URL.revokeObjectURL(previousUrl);
    }

    objectUrlsRef.current.set(id, url);
  }, []);

  useEffect(() => () => {
    revokeTrackedObjectUrls();
  }, [revokeTrackedObjectUrls]);

  useEffect(() => {
    const pendingIds = Array.from(new Set(
      state.workspaceItems
        .filter((item) => item.image.source === 'local' && !item.image.objectUrl)
        .map((item) => item.id),
    )).filter((id) => !missingLocalImageIdsRef.current.has(id));

    if (!pendingIds.length) {
      return;
    }

    let active = true;

    getLocalImageBlobs(pendingIds)
      .then((blobs) => {
        if (!active) {
          return;
        }

        const hydratedImages: Array<{ id: string; objectUrl: string }> = [];

        for (const id of pendingIds) {
          const blob = blobs.get(id);
          if (!blob) {
            missingLocalImageIdsRef.current.add(id);
            continue;
          }

          const objectUrl = URL.createObjectURL(blob);
          trackObjectUrl(id, objectUrl);
          hydratedImages.push({ id, objectUrl });
        }

        if (hydratedImages.length) {
          dispatch({ type: 'hydrate_local_sources', images: hydratedImages });
        }
      })
      .catch(() => {
        if (!active) {
          return;
        }

        for (const id of pendingIds) {
          missingLocalImageIdsRef.current.add(id);
        }
      });

    return () => {
      active = false;
    };
  }, [state.workspaceItems, trackObjectUrl]);

  const setCurrentView = useCallback((view: ViewType) => {
    dispatch({ type: 'set_view', view });
  }, []);

  const setLanguage = useCallback((language: Language) => {
    dispatch({ type: 'set_language', language });
  }, []);

  const setTheme = useCallback((theme: Theme) => {
    dispatch({ type: 'set_theme', theme });
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

      const uploadError = validateImportFiles(files);
      if (uploadError) {
        dispatch({ type: 'import_failed', uploadError });
        return;
      }

      dispatch({ type: 'import_started' });

      try {
        const { importedItems, createdObjectUrls, session } = await importWorkspaceFiles(files, state.language);

        for (const entry of createdObjectUrls) {
          trackObjectUrl(entry.id, entry.url);
        }

        const firstItem = importedItems[0];

        dispatch({
          type: 'import_succeeded',
          items: importedItems,
          selectedImageId: firstItem?.id ?? '',
          session,
        });
      } catch {
        dispatch({ type: 'import_failed', uploadError: 'import_failed' });
      }
    },
    [state.language, trackObjectUrl],
  );

  const openSession = useCallback((sessionId: string) => {
    const session = state.recentSessions.find((item) => item.id === sessionId);
    if (!session) {
      return;
    }

    revokeTrackedObjectUrls();
    dispatch({ type: 'open_session', session });
  }, [revokeTrackedObjectUrls, state.recentSessions]);

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
        const historyItems = await exportCurrentWorkspaceItem({
          item: activeItem,
          exportSettings: state.exportSettings,
          selectedStyle,
          styleTitle,
          brandName,
        });

        dispatch({ type: 'export_succeeded', historyItems });
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
        const historyItems = await exportWorkspaceBatch({
          items: state.workspaceItems,
          selectedImageId: state.selectedImageId,
          exportSettings: state.exportSettings,
          selectedStyle,
          styleTitle,
          brandName,
        });

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
      sourceImage: activeItem?.image ?? null,
      exifData: activeItem?.exifData ?? null,
    },
    actions: {
      setCurrentView,
      setLanguage,
      setTheme,
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
      exportCurrent,
      exportAll,
    },
  };
}
