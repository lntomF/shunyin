import type { SupabaseClient } from '@supabase/supabase-js';

interface SaveWorkspaceRpcPayload {
  workspaceId: string;
  title: string;
  coverUrl: string | null;
  sourceType: string;
  photos: unknown[];
}

interface SaveWorkspaceRpcResponse {
  workspace_id?: string | null;
  removed_storage_paths?: unknown;
}

interface DeleteRpcResponse {
  workspace_id?: string | null;
  storage_paths?: unknown;
}

type RpcSupport = 'unknown' | 'available' | 'missing';

const SAVE_WORKSPACE_RPC_NAME = 'shunyin_save_workspace_state';
const DELETE_WORKSPACE_RPC_NAME = 'shunyin_delete_workspace';
const DELETE_PHOTO_RPC_NAME = 'shunyin_delete_photo';

let saveWorkspaceRpcSupport: RpcSupport = 'unknown';
let deleteWorkspaceRpcSupport: RpcSupport = 'unknown';
let deletePhotoRpcSupport: RpcSupport = 'unknown';

function isMissingRpcFunction(
  error: { message?: string | null; details?: string | null; hint?: string | null } | null,
  functionName: string,
) {
  if (!error) {
    return false;
  }

  const detail = [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase();
  return detail.includes(functionName.toLowerCase()) && (
    detail.includes('could not find the function')
    || detail.includes('does not exist')
    || detail.includes('schema cache')
  );
}

function normalizeStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [] as string[];
  }

  return value.filter((item): item is string => typeof item === 'string' && Boolean(item));
}

export async function trySaveWorkspaceRpc(client: SupabaseClient, payload: SaveWorkspaceRpcPayload) {
  if (saveWorkspaceRpcSupport === 'missing') {
    return null;
  }

  const { data, error } = await client.rpc(SAVE_WORKSPACE_RPC_NAME, {
    p_workspace_id: payload.workspaceId,
    p_title: payload.title,
    p_cover_url: payload.coverUrl,
    p_source_type: payload.sourceType,
    p_photos: payload.photos,
  });

  if (error) {
    if (isMissingRpcFunction(error, SAVE_WORKSPACE_RPC_NAME)) {
      saveWorkspaceRpcSupport = 'missing';
      return null;
    }

    throw error;
  }

  saveWorkspaceRpcSupport = 'available';

  const result = (data ?? {}) as SaveWorkspaceRpcResponse;
  return {
    workspaceId: result.workspace_id ?? payload.workspaceId,
    removedStoragePaths: normalizeStringArray(result.removed_storage_paths),
  };
}

export async function tryDeleteWorkspaceRpc(client: SupabaseClient, workspaceId: string) {
  if (deleteWorkspaceRpcSupport === 'missing') {
    return null;
  }

  const { data, error } = await client.rpc(DELETE_WORKSPACE_RPC_NAME, {
    p_workspace_id: workspaceId,
  });

  if (error) {
    if (isMissingRpcFunction(error, DELETE_WORKSPACE_RPC_NAME)) {
      deleteWorkspaceRpcSupport = 'missing';
      return null;
    }

    throw error;
  }

  deleteWorkspaceRpcSupport = 'available';

  const result = (data ?? {}) as DeleteRpcResponse;
  return {
    workspaceId: result.workspace_id ?? null,
    storagePaths: normalizeStringArray(result.storage_paths),
  };
}

export async function tryDeletePhotoRpc(client: SupabaseClient, workspaceId: string, photoId: string) {
  if (deletePhotoRpcSupport === 'missing') {
    return null;
  }

  const { data, error } = await client.rpc(DELETE_PHOTO_RPC_NAME, {
    p_workspace_id: workspaceId,
    p_photo_id: photoId,
  });

  if (error) {
    if (isMissingRpcFunction(error, DELETE_PHOTO_RPC_NAME)) {
      deletePhotoRpcSupport = 'missing';
      return null;
    }

    throw error;
  }

  deletePhotoRpcSupport = 'available';

  const result = (data ?? {}) as DeleteRpcResponse;
  return {
    workspaceId: result.workspace_id ?? null,
    storagePaths: normalizeStringArray(result.storage_paths),
  };
}
