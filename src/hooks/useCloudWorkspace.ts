import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import type { CloudSyncStatus, Language, ProfileRecord, SessionItem, WorkspaceItem } from '../types/app';
import { cloudUnavailableErrorMessage, supabase } from '../lib/supabase';
import {
  buildCloudSessions,
  deleteCloudPhotoById,
  deleteCloudWorkspaceById,
  loadCloudWorkspaceData,
  openCloudWorkspaceSession,
  type DeleteCloudPhotoResult,
  type ResolvedCloudWorkspaceRecord,
  saveCloudWorkspace,
  type SaveCloudWorkspacePayload,
  type SaveCloudWorkspaceResult,
} from '../services/cloudWorkspaceService';

function toErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useCloudWorkspace(user: User | null, language: Language) {
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [status, setStatus] = useState<CloudSyncStatus>(supabase ? 'idle' : 'disabled');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSavedWorkspaceId, setLastSavedWorkspaceId] = useState<string | null>(null);
  const [workspaceRecords, setWorkspaceRecords] = useState<ResolvedCloudWorkspaceRecord[]>([]);
  const [deletingWorkspaceId, setDeletingWorkspaceId] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);

  const resetCloudState = useCallback((nextStatus: CloudSyncStatus) => {
    setProfile(null);
    setWorkspaceRecords([]);
    setStatus(nextStatus);
    setErrorMessage(null);
    setLastSavedWorkspaceId(null);
    setDeletingWorkspaceId(null);
    setDeletingPhotoId(null);
  }, []);

  const requireCloudClient = useCallback(() => {
    if (!supabase) {
      throw new Error(cloudUnavailableErrorMessage);
    }

    return supabase;
  }, []);

  const refreshCloudData = useCallback(async () => {
    if (!supabase) {
      resetCloudState('disabled');
      return;
    }

    if (!user) {
      resetCloudState('idle');
      return;
    }

    setStatus('loading');
    setErrorMessage(null);

    try {
      const nextData = await loadCloudWorkspaceData(supabase, user.id);
      setProfile(nextData.profile);
      setWorkspaceRecords(nextData.workspaceRecords);
      setStatus('idle');
    } catch (error) {
      setProfile(null);
      setWorkspaceRecords([]);
      setStatus('error');
      setErrorMessage(toErrorMessage(error, 'Failed to load cloud workspace.'));
      throw error;
    }
  }, [resetCloudState, user]);

  useEffect(() => {
    if (!supabase) {
      resetCloudState('disabled');
      return;
    }

    if (!user) {
      resetCloudState('idle');
      return;
    }

    refreshCloudData().catch(() => {
      // refreshCloudData already sets the visible error state.
    });
  }, [refreshCloudData, resetCloudState, user]);

  const saveWorkspaceCallback = useCallback(
    async ({ items, selectedImageId, cloudWorkspaceId }: SaveCloudWorkspacePayload): Promise<SaveCloudWorkspaceResult> => {
      const client = requireCloudClient();

      if (!user) {
        throw new Error('User is not authenticated.');
      }

      setStatus('saving');
      setErrorMessage(null);
      setLastSavedWorkspaceId(null);

      try {
        const result = await saveCloudWorkspace({
          client,
          userId: user.id,
          language,
          workspaceRecords,
          items,
          selectedImageId,
          cloudWorkspaceId,
        });

        await refreshCloudData();
        setStatus('saved');
        setLastSavedWorkspaceId(result.workspaceId);
        return result;
      } catch (error) {
        setStatus('error');
        setErrorMessage(toErrorMessage(error, 'Failed to save cloud workspace.'));
        throw error;
      }
    },
    [language, refreshCloudData, requireCloudClient, user, workspaceRecords],
  );

  const deleteWorkspaceCallback = useCallback(
    async (workspaceId: string) => {
      const client = requireCloudClient();

      if (!user) {
        throw new Error('User is not authenticated.');
      }

      setDeletingWorkspaceId(workspaceId);
      setErrorMessage(null);

      try {
        await deleteCloudWorkspaceById({
          client,
          userId: user.id,
          workspaceId,
          workspaceRecords,
        });

        await refreshCloudData();
        setStatus('idle');
      } catch (error) {
        setStatus('error');
        setErrorMessage(toErrorMessage(error, 'Failed to delete cloud workspace.'));
        throw error;
      } finally {
        setDeletingWorkspaceId(null);
      }
    },
    [refreshCloudData, requireCloudClient, user, workspaceRecords],
  );

  const openWorkspaceCallback = useCallback(
    async (workspaceId: string) => {
      const client = requireCloudClient();
      return openCloudWorkspaceSession({
        client,
        workspaceId,
        workspaceRecords,
        language,
      });
    },
    [language, requireCloudClient, workspaceRecords],
  );

  const deletePhotoCallback = useCallback(
    async (workspaceId: string, photoId: string): Promise<DeleteCloudPhotoResult> => {
      const client = requireCloudClient();

      if (!user) {
        throw new Error('User is not authenticated.');
      }

      setDeletingPhotoId(photoId);
      setErrorMessage(null);

      try {
        const result = await deleteCloudPhotoById({
          client,
          userId: user.id,
          workspaceId,
          photoId,
          workspaceRecords,
          language,
        });

        await refreshCloudData();
        return result;
      } catch (error) {
        setStatus('error');
        setErrorMessage(toErrorMessage(error, 'Failed to delete cloud photo.'));
        throw error;
      } finally {
        setDeletingPhotoId(null);
      }
    },
    [language, refreshCloudData, requireCloudClient, user, workspaceRecords],
  );

  const cloudSessions = useMemo(
    () => buildCloudSessions(workspaceRecords, language),
    [language, workspaceRecords],
  );

  return {
    isEnabled: Boolean(supabase),
    profile,
    status,
    errorMessage,
    lastSavedWorkspaceId,
    deletingWorkspaceId,
    deletingPhotoId,
    cloudSessions,
    refreshCloudData,
    openWorkspace: openWorkspaceCallback,
    saveWorkspace: saveWorkspaceCallback,
    deleteWorkspace: deleteWorkspaceCallback,
    deletePhoto: deletePhotoCallback,
  };
}
