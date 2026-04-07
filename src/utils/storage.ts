import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkspaceItem } from '../types/app';
import { getLocalImageBlob } from './localImageStore';

interface UploadedAsset {
  path: string;
}

interface UploadedWorkspacePhoto {
  original: UploadedAsset;
  preview: UploadedAsset;
}

function sanitizePathSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'image';
}

function inferExtension(fileName: string, mimeType?: string) {
  const fromName = fileName.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
  if (fromName) {
    return fromName;
  }

  const byMime = mimeType?.split('/')[1]?.toLowerCase();
  if (!byMime) {
    return 'jpg';
  }

  if (byMime === 'jpeg') {
    return 'jpg';
  }

  return byMime;
}

async function fetchBlob(src: string) {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Failed to read image source: ${response.status}`);
  }

  return response.blob();
}

async function uploadAsset(
  client: SupabaseClient,
  bucketName: string,
  path: string,
  src: string,
  contentType?: string,
) {
  const blob = await fetchBlob(src);
  const finalContentType = contentType || blob.type || 'image/jpeg';
  const { error } = await client.storage.from(bucketName).upload(path, blob, {
    cacheControl: '3600',
    contentType: finalContentType,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return {
    path,
  };
}

async function uploadAssetFromBlob(
  client: SupabaseClient,
  bucketName: string,
  path: string,
  blob: Blob,
  contentType?: string,
) {
  const finalContentType = contentType || blob.type || 'image/jpeg';
  const { error } = await client.storage.from(bucketName).upload(path, blob, {
    cacheControl: '3600',
    contentType: finalContentType,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  return {
    path,
  };
}

async function resolveOriginalUploadBlob(item: WorkspaceItem) {
  if (item.image.source === 'local') {
    const storedBlob = await getLocalImageBlob(item.id);
    if (storedBlob) {
      return storedBlob;
    }
  }

  return fetchBlob(item.image.objectUrl ?? item.image.src);
}

export async function uploadWorkspaceItemToStorage(
  client: SupabaseClient,
  bucketName: string,
  userId: string,
  workspaceId: string,
  item: WorkspaceItem,
) : Promise<UploadedWorkspacePhoto> {
  const safeName = sanitizePathSegment(item.image.name);
  const extension = inferExtension(item.image.name, item.image.mimeType);
  const timeToken = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const basePath = `${userId}/${workspaceId}/${safeName}-${timeToken}`;
  const originalPath = `${basePath}.${extension}`;
  const previewPath = `${basePath}-preview.jpg`;
  const previewSrc = item.image.persistedSrc ?? item.image.src;
  const originalBlob = await resolveOriginalUploadBlob(item);

  const [original, preview] = await Promise.all([
    uploadAssetFromBlob(client, bucketName, originalPath, originalBlob, item.image.mimeType),
    uploadAsset(client, bucketName, previewPath, previewSrc, 'image/jpeg'),
  ]);

  return {
    original,
    preview,
  };
}
