import type { SupabaseClient } from '@supabase/supabase-js';
import { defaultExifData } from '../data/mockData';
import type { ExifData, Language, ProfileRecord, SessionItem, WorkspaceImage, WorkspaceItem } from '../types/app';
import { tryDeletePhotoRpc, tryDeleteWorkspaceRpc, trySaveWorkspaceRpc } from './cloudWorkspaceRpc';
import { formatBytes, formatResolution } from '../utils/format';
import { getLocalExifFallbacks, readExifOverridesFromUrl } from '../utils/image';
import { uploadWorkspaceItemToStorage } from '../utils/storage';

export interface SaveCloudWorkspacePayload {
  items: WorkspaceItem[];
  selectedImageId: string;
  cloudWorkspaceId: string | null;
}

export interface SaveCloudWorkspaceResult {
  workspaceId: string;
  session: SessionItem | null;
}

export interface DeleteCloudPhotoResult {
  workspaceId: string | null;
  session: SessionItem | null;
}

export interface CloudWorkspaceData {
  profile: ProfileRecord;
  workspaceRecords: ResolvedCloudWorkspaceRecord[];
}

interface SaveCloudWorkspaceOptions extends SaveCloudWorkspacePayload {
  client: SupabaseClient;
  userId: string;
  language: Language;
  workspaceRecords: ResolvedCloudWorkspaceRecord[];
}

interface DeleteCloudWorkspaceOptions {
  client: SupabaseClient;
  userId: string;
  workspaceId: string;
  workspaceRecords: ResolvedCloudWorkspaceRecord[];
}

interface OpenCloudWorkspaceOptions {
  client: SupabaseClient;
  workspaceId: string;
  workspaceRecords: ResolvedCloudWorkspaceRecord[];
  language: Language;
}

interface DeleteCloudPhotoOptions extends OpenCloudWorkspaceOptions {
  userId: string;
  photoId: string;
}

const STORED_EXIF_KEYS = [
  'cameraBody',
  'lens',
  'aperture',
  'shutter',
  'iso',
  'colorSpace',
  'bitDepth',
  'metering',
  'focusMode',
] as const;

type StoredExifKey = typeof STORED_EXIF_KEYS[number];
type StoredExifData = Pick<ExifData, StoredExifKey>;

interface CloudPhotoRecord {
  id: string;
  file_name: string;
  original_url: string | null;
  preview_url: string | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  created_at: string;
  exif_overrides?: Partial<StoredExifData> | null;
}

interface CloudWorkspaceRecord {
  id: string;
  title: string;
  cover_url: string | null;
  source_type: string | null;
  created_at: string;
  updated_at: string;
  photos: CloudPhotoRecord[] | null;
}

interface ResolvedCloudPhotoRecord extends CloudPhotoRecord {
  resolved_original_url: string | null;
  resolved_preview_url: string | null;
}

export interface ResolvedCloudWorkspaceRecord extends Omit<CloudWorkspaceRecord, 'photos' | 'cover_url'> {
  cover_url: string | null;
  photos: ResolvedCloudPhotoRecord[];
}

interface InsertedPhotoRecord {
  id: string;
  original_url: string | null;
  preview_url: string | null;
}

interface CloudPhotoWithExif extends ResolvedCloudPhotoRecord {
  resolvedExifData: Partial<ExifData>;
}

interface PhotoMutationRow {
  file_name: string;
  original_url: string;
  preview_url: string;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  exif_overrides: StoredExifData;
}

interface PhotoUpdateRow extends PhotoMutationRow {
  id: string;
}

interface RpcWorkspacePhotoRow {
  id: string;
  file_name: string;
  original_url: string;
  preview_url: string;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  size_bytes: number | null;
  exif_overrides: StoredExifData;
}

function buildWorkspaceTitle(items: WorkspaceItem[]) {
  const first = items[0];
  if (!first) {
    return 'SHUNYIN Workspace';
  }

  return items.length > 1 ? `${first.image.name} +${items.length - 1}` : first.image.name;
}

const STORAGE_BUCKET = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'workspace-images';
const BASE_PHOTO_SELECT = `
        id,
        file_name,
        original_url,
        preview_url,
        mime_type,
        width,
        height,
        size_bytes,
        created_at
`;
const PHOTO_SELECT_WITH_EXIF = `${BASE_PHOTO_SELECT},
        exif_overrides`;

let photoExifColumnSupport: 'unknown' | 'available' | 'missing' = 'unknown';

function getWorkspaceSelectClause(includeExifOverrides: boolean) {
  const photoFields = includeExifOverrides ? PHOTO_SELECT_WITH_EXIF : BASE_PHOTO_SELECT;

  return `
      id,
      title,
      cover_url,
      source_type,
      created_at,
      updated_at,
      photos (
${photoFields}
      )
    `;
}

function isMissingPhotoExifColumn(error: { message?: string | null; details?: string | null; hint?: string | null } | null) {
  if (!error) {
    return false;
  }

  const detail = [error.message, error.details, error.hint].filter(Boolean).join(' ').toLowerCase();
  return detail.includes('exif_overrides') && detail.includes('column');
}

function normalizeStoredExifData(value: unknown): Partial<StoredExifData> | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const normalized: Partial<StoredExifData> = {};

  for (const key of STORED_EXIF_KEYS) {
    if (typeof record[key] === 'string') {
      normalized[key] = record[key];
    }
  }

  return Object.keys(normalized).length ? normalized : null;
}

function serializeExifOverrides(exifData: ExifData): StoredExifData {
  return {
    cameraBody: exifData.cameraBody,
    lens: exifData.lens,
    aperture: exifData.aperture,
    shutter: exifData.shutter,
    iso: exifData.iso,
    colorSpace: exifData.colorSpace,
    bitDepth: exifData.bitDepth,
    metering: exifData.metering,
    focusMode: exifData.focusMode,
  };
}

async function fetchWorkspaceRecord(client: SupabaseClient, workspaceId: string) {
  const includeExifOverrides = photoExifColumnSupport !== 'missing';
  let { data, error } = await client
    .from('workspaces')
    .select(getWorkspaceSelectClause(includeExifOverrides))
    .eq('id', workspaceId)
    .single();

  if (error && includeExifOverrides && isMissingPhotoExifColumn(error)) {
    photoExifColumnSupport = 'missing';
    ({ data, error } = await client
      .from('workspaces')
      .select(getWorkspaceSelectClause(false))
      .eq('id', workspaceId)
      .single());
  } else if (!error && includeExifOverrides) {
    photoExifColumnSupport = 'available';
  }

  if (error) {
    throw error;
  }

  return data as CloudWorkspaceRecord;
}

async function listWorkspaceRecords(client: SupabaseClient, userId: string) {
  const includeExifOverrides = photoExifColumnSupport !== 'missing';
  let { data, error } = await client
    .from('workspaces')
    .select(getWorkspaceSelectClause(includeExifOverrides))
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error && includeExifOverrides && isMissingPhotoExifColumn(error)) {
    photoExifColumnSupport = 'missing';
    ({ data, error } = await client
      .from('workspaces')
      .select(getWorkspaceSelectClause(false))
      .eq('user_id', userId)
      .order('updated_at', { ascending: false }));
  } else if (!error && includeExifOverrides) {
    photoExifColumnSupport = 'available';
  }

  return {
    data: (data ?? []) as CloudWorkspaceRecord[],
    error,
  };
}

function buildPhotoMutationPayload(row: PhotoMutationRow, includeExifOverrides: boolean) {
  return {
    file_name: row.file_name,
    original_url: row.original_url,
    preview_url: row.preview_url,
    mime_type: row.mime_type,
    width: row.width,
    height: row.height,
    size_bytes: row.size_bytes,
    ...(includeExifOverrides ? { exif_overrides: row.exif_overrides } : {}),
  };
}

async function insertPhotoRows(client: SupabaseClient, workspaceId: string, rows: PhotoMutationRow[]) {
  const includeExifOverrides = photoExifColumnSupport !== 'missing';
  let { data, error } = await client
    .from('photos')
    .insert(
      rows.map((row) => ({
        workspace_id: workspaceId,
        ...buildPhotoMutationPayload(row, includeExifOverrides),
      })),
    )
    .select('id, original_url, preview_url');

  if (error && includeExifOverrides && isMissingPhotoExifColumn(error)) {
    photoExifColumnSupport = 'missing';
    ({ data, error } = await client
      .from('photos')
      .insert(
        rows.map((row) => ({
          workspace_id: workspaceId,
          ...buildPhotoMutationPayload(row, false),
        })),
      )
      .select('id, original_url, preview_url'));
  } else if (!error && includeExifOverrides) {
    photoExifColumnSupport = 'available';
  }

  return {
    data: (data ?? []) as InsertedPhotoRecord[],
    error,
  };
}

async function updatePhotoRow(client: SupabaseClient, row: PhotoUpdateRow) {
  const includeExifOverrides = photoExifColumnSupport !== 'missing';
  let { error } = await client
    .from('photos')
    .update(buildPhotoMutationPayload(row, includeExifOverrides))
    .eq('id', row.id);

  if (error && includeExifOverrides && isMissingPhotoExifColumn(error)) {
    photoExifColumnSupport = 'missing';
    ({ error } = await client
      .from('photos')
      .update(buildPhotoMutationPayload(row, false))
      .eq('id', row.id));
  } else if (!error && includeExifOverrides) {
    photoExifColumnSupport = 'available';
  }

  return { error };
}

function isDirectUrl(value: string | null) {
  if (!value) {
    return false;
  }

  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:') || value.startsWith('blob:');
}

function compactStoragePaths(...values: Array<string | null | undefined>) {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value) && !isDirectUrl(value!))));
}

function buildRpcPhotoRows(
  items: WorkspaceItem[],
  uploadedPhotos: Array<{
    item: WorkspaceItem;
    uploaded: Awaited<ReturnType<typeof uploadWorkspaceItemToStorage>>;
  }>,
): RpcWorkspacePhotoRow[] {
  const uploadedPhotosById = new Map(
    uploadedPhotos.map(({ item, uploaded }) => [
      item.id,
      {
        originalPath: uploaded.original.path,
        previewPath: uploaded.preview.path,
      },
    ]),
  );

  return items.map((item) => {
    const uploaded = uploadedPhotosById.get(item.id);

    return {
      id: item.id,
      file_name: item.image.name,
      original_url: uploaded?.originalPath ?? item.image.storageOriginalPath ?? '',
      preview_url: uploaded?.previewPath ?? item.image.storagePreviewPath ?? '',
      mime_type: item.image.mimeType ?? null,
      width: item.image.width ?? null,
      height: item.image.height ?? null,
      size_bytes: item.image.sizeBytes ?? null,
      exif_overrides: serializeExifOverrides(item.exifData),
    };
  });
}

async function removeStoragePathsBestEffort(client: SupabaseClient, paths: Array<string | null | undefined>, warningMessage: string) {
  const nextPaths = compactStoragePaths(...paths);
  if (!nextPaths.length) {
    return;
  }

  const { error } = await client.storage.from(STORAGE_BUCKET).remove(nextPaths);
  if (error) {
    console.warn(warningMessage, error);
  }
}

async function resolveSignedAsset(client: SupabaseClient, pathOrUrl: string | null) {
  if (!pathOrUrl) {
    return null;
  }

  if (isDirectUrl(pathOrUrl)) {
    return pathOrUrl;
  }

  const { data, error } = await client.storage.from(STORAGE_BUCKET).createSignedUrl(pathOrUrl, 60 * 60);
  if (error) {
    throw error;
  }

  return data.signedUrl;
}

async function hydrateWorkspaceRecord(client: SupabaseClient, workspace: CloudWorkspaceRecord): Promise<ResolvedCloudWorkspaceRecord> {
  const photos = workspace.photos ?? [];
  const [resolvedCoverUrl, resolvedPhotos] = await Promise.all([
    resolveSignedAsset(client, workspace.cover_url),
    Promise.all(
      photos.map(async (photo) => ({
        ...photo,
        resolved_original_url: await resolveSignedAsset(client, photo.original_url),
        resolved_preview_url: await resolveSignedAsset(client, photo.preview_url),
      })),
    ),
  ]);

  return {
    ...workspace,
    cover_url: resolvedCoverUrl,
    photos: resolvedPhotos,
  };
}

async function fetchHydratedWorkspace(client: SupabaseClient, workspaceId: string) {
  return hydrateWorkspaceRecord(client, await fetchWorkspaceRecord(client, workspaceId));
}

function buildCloudExif(photo: CloudPhotoRecord, language: Language, exifOverrides: Partial<ExifData> = {}): ExifData {
  const fallback = getLocalExifFallbacks(language);
  const width = photo.width ?? 1600;
  const height = photo.height ?? 1000;

  return {
    ...defaultExifData,
    cameraBody: exifOverrides.cameraBody ?? fallback.cameraBody,
    lens: exifOverrides.lens ?? fallback.lens,
    aperture: exifOverrides.aperture ?? fallback.aperture,
    shutter: exifOverrides.shutter ?? fallback.shutter,
    iso: exifOverrides.iso ?? fallback.iso,
    colorSpace: exifOverrides.colorSpace ?? fallback.colorSpace,
    bitDepth: exifOverrides.bitDepth ?? fallback.bitDepth,
    metering: exifOverrides.metering ?? fallback.metering,
    focusMode: exifOverrides.focusMode ?? fallback.focusMode,
    fileSize: formatBytes(photo.size_bytes ?? 0, language),
    resolution: formatResolution(width, height, photo.mime_type ?? undefined, language),
  };
}

function toWorkspaceImage(photo: ResolvedCloudPhotoRecord, workspace: ResolvedCloudWorkspaceRecord): WorkspaceImage {
  const src = photo.resolved_original_url ?? photo.resolved_preview_url ?? workspace.cover_url ?? '';
  const previewSrc = photo.resolved_preview_url ?? photo.resolved_original_url ?? workspace.cover_url ?? src;

  return {
    id: photo.id,
    name: photo.file_name,
    src,
    persistedSrc: previewSrc,
    storageOriginalPath: photo.original_url ?? undefined,
    storagePreviewPath: photo.preview_url ?? undefined,
    width: photo.width ?? undefined,
    height: photo.height ?? undefined,
    sizeBytes: photo.size_bytes ?? undefined,
    mimeType: photo.mime_type ?? undefined,
    source: 'cloud',
    createdAt: photo.created_at,
  };
}

function toCloudSession(workspace: ResolvedCloudWorkspaceRecord, language: Language): SessionItem | null {
  const photos = workspace.photos ?? [];
  if (!photos.length) {
    return null;
  }

  const items: WorkspaceItem[] = photos.map((photo) => ({
    id: photo.id,
    image: toWorkspaceImage(photo, workspace),
    exifData: buildCloudExif(photo, language, normalizeStoredExifData(photo.exif_overrides) ?? undefined),
  }));

  const featured = items[0];
  if (!featured) {
    return null;
  }

  return {
    id: `cloud-${workspace.id}`,
    title: workspace.title,
    coverSrc: workspace.cover_url ?? featured.image.src,
    updatedAt: workspace.updated_at,
    itemCount: items.length,
    source: 'cloud',
    cloudWorkspaceId: workspace.id,
    activeImageId: featured.id,
    items,
    image: featured.image,
    exifData: featured.exifData,
  };
}

async function resolvePhotoExif(photo: ResolvedCloudPhotoRecord) {
  const storedExif = normalizeStoredExifData(photo.exif_overrides);
  if (storedExif) {
    return storedExif;
  }

  const sourceUrl = photo.resolved_original_url ?? photo.resolved_preview_url;
  if (!sourceUrl) {
    return {};
  }

  try {
    return await readExifOverridesFromUrl(sourceUrl);
  } catch {
    return {};
  }
}

async function buildDetailedCloudSession(workspace: ResolvedCloudWorkspaceRecord, language: Language): Promise<SessionItem | null> {
  const photos = workspace.photos ?? [];
  if (!photos.length) {
    return null;
  }

  const photosWithExif: CloudPhotoWithExif[] = await Promise.all(
    photos.map(async (photo) => ({
      ...photo,
      resolvedExifData: await resolvePhotoExif(photo),
    })),
  );

  const items: WorkspaceItem[] = photosWithExif.map((photo) => ({
    id: photo.id,
    image: toWorkspaceImage(photo, workspace),
    exifData: buildCloudExif(photo, language, photo.resolvedExifData),
  }));

  const featured = items[0];
  if (!featured) {
    return null;
  }

  return {
    id: `cloud-${workspace.id}`,
    title: workspace.title,
    coverSrc: workspace.cover_url ?? featured.image.src,
    updatedAt: workspace.updated_at,
    itemCount: items.length,
    source: 'cloud',
    cloudWorkspaceId: workspace.id,
    activeImageId: featured.id,
    items,
    image: featured.image,
    exifData: featured.exifData,
  };
}

export async function loadCloudWorkspaceData(client: SupabaseClient, userId: string): Promise<CloudWorkspaceData> {
  const [{ data: profileData, error: profileError }, { data: workspaceData, error: workspaceError }] = await Promise.all([
    client
      .from('profiles')
      .select('id, email, display_name, avatar_url, created_at, updated_at')
      .eq('id', userId)
      .single(),
    listWorkspaceRecords(client, userId),
  ]);

  if (profileError) {
    throw profileError;
  }

  if (workspaceError) {
    throw workspaceError;
  }

  const workspaceRecords = await Promise.all((workspaceData ?? []).map((workspace) => hydrateWorkspaceRecord(client, workspace)));

  return {
    profile: profileData as ProfileRecord,
    workspaceRecords,
  };
}

export async function saveCloudWorkspace({
  client,
  userId,
  language,
  workspaceRecords,
  items,
  selectedImageId,
  cloudWorkspaceId,
}: SaveCloudWorkspaceOptions): Promise<SaveCloudWorkspaceResult> {
  if (!items.length) {
    throw new Error('No workspace items to save.');
  }

  let workspaceId = cloudWorkspaceId;
  let activeWorkspaceRecord = cloudWorkspaceId
    ? workspaceRecords.find((workspace) => workspace.id === cloudWorkspaceId) ?? null
    : null;

  if (workspaceId && !activeWorkspaceRecord) {
    activeWorkspaceRecord = await fetchHydratedWorkspace(client, workspaceId);
  }

  if (!workspaceId) {
    const { data: workspace, error: workspaceError } = await client
      .from('workspaces')
      .insert({
        user_id: userId,
        title: buildWorkspaceTitle(items),
        cover_url: null,
        source_type: items[0]?.image.source ?? 'local',
      })
      .select('id')
      .single();

    if (workspaceError) {
      throw workspaceError;
    }

    workspaceId = workspace.id;
  }

  const uploadedPaths: string[] = [];
  const insertedPhotoIds: string[] = [];

  try {
    const existingPhotosById = new Map((activeWorkspaceRecord?.photos ?? []).map((photo) => [photo.id, photo]));
    const currentItemIds = new Set(items.map((item) => item.id));
    const uploadedPhotos: Array<{
      item: WorkspaceItem;
      uploaded: Awaited<ReturnType<typeof uploadWorkspaceItemToStorage>>;
    }> = [];
    const updateRows: PhotoUpdateRow[] = [];

    const removedPhotos = (activeWorkspaceRecord?.photos ?? []).filter((photo) => !currentItemIds.has(photo.id));

    for (const item of items) {
      const existingPhoto = existingPhotosById.get(item.id);
      const hasExistingStorage = Boolean(item.image.storageOriginalPath && item.image.storagePreviewPath && existingPhoto);

      if (hasExistingStorage) {
        updateRows.push({
          id: item.id,
          file_name: item.image.name,
          original_url: item.image.storageOriginalPath!,
          preview_url: item.image.storagePreviewPath!,
          mime_type: item.image.mimeType ?? null,
          width: item.image.width ?? null,
          height: item.image.height ?? null,
          size_bytes: item.image.sizeBytes ?? null,
          exif_overrides: serializeExifOverrides(item.exifData),
        });
        continue;
      }

      const uploaded = await uploadWorkspaceItemToStorage(
        client,
        STORAGE_BUCKET,
        userId,
        workspaceId,
        item,
      );

      uploadedPaths.push(uploaded.original.path, uploaded.preview.path);
      uploadedPhotos.push({ item, uploaded });
    }

        const selectedItem = items.find((item) => item.id === selectedImageId) ?? items[0];
        const selectedCoverPath = uploadedPhotos.find(({ item }) => item.id === selectedItem?.id)?.uploaded.preview.path
          ?? selectedItem?.image.storagePreviewPath
          ?? selectedItem?.image.storageOriginalPath
          ?? null;
        const workspaceTitle = buildWorkspaceTitle(items);
        const workspaceSourceType = items.some((item) => item.image.source === 'local') ? 'local' : items[0]?.image.source ?? 'local';

        const rpcResult = await trySaveWorkspaceRpc(client, {
          workspaceId,
          title: workspaceTitle,
          coverUrl: selectedCoverPath,
          sourceType: workspaceSourceType,
          photos: buildRpcPhotoRows(items, uploadedPhotos),
        });

        if (rpcResult) {
          await removeStoragePathsBestEffort(
            client,
            rpcResult.removedStoragePaths,
            'Workspace RPC save succeeded but storage cleanup failed.',
          );

          const hydratedWorkspace = await fetchHydratedWorkspace(client, rpcResult.workspaceId);
          return {
            workspaceId: rpcResult.workspaceId,
            session: await buildDetailedCloudSession(hydratedWorkspace, language),
          };
        }

        if (uploadedPhotos.length) {
          const { data: insertedPhotos, error: photosError } = await insertPhotoRows(
            client,
            workspaceId,
        uploadedPhotos.map(({ item, uploaded }) => ({
          file_name: item.image.name,
          original_url: uploaded.original.path,
          preview_url: uploaded.preview.path,
          mime_type: item.image.mimeType ?? null,
          width: item.image.width ?? null,
          height: item.image.height ?? null,
          size_bytes: item.image.sizeBytes ?? null,
          exif_overrides: serializeExifOverrides(item.exifData),
        })),
      );

      if (photosError) {
        throw photosError;
      }

      for (const photo of insertedPhotos) {
        insertedPhotoIds.push(photo.id);
      }
    }

    for (const row of updateRows) {
      const { error } = await updatePhotoRow(client, row);
      if (error) {
        throw error;
      }
    }

    if (removedPhotos.length) {
      const removedPhotoIds = removedPhotos.map((photo) => photo.id);
      const removedPaths = compactStoragePaths(...removedPhotos.flatMap((photo) => [photo.original_url, photo.preview_url]));

      const { error: deletePhotosError } = await client.from('photos').delete().in('id', removedPhotoIds);
      if (deletePhotosError) {
        throw deletePhotosError;
      }

      if (removedPaths.length) {
        const { error: removeStorageError } = await client.storage.from(STORAGE_BUCKET).remove(removedPaths);
        if (removeStorageError) {
          throw removeStorageError;
        }
      }
    }

        const { error: coverError } = await client
          .from('workspaces')
          .update({
            title: workspaceTitle,
            cover_url: selectedCoverPath,
            source_type: workspaceSourceType,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workspaceId);

    if (coverError) {
      throw coverError;
    }

    const hydratedWorkspace = await fetchHydratedWorkspace(client, workspaceId);
    const session = await buildDetailedCloudSession(hydratedWorkspace, language);

    return {
      workspaceId,
      session,
    };
  } catch (error) {
    if (insertedPhotoIds.length) {
      await client.from('photos').delete().in('id', insertedPhotoIds);
    }

    if (uploadedPaths.length) {
      await client.storage.from(STORAGE_BUCKET).remove(uploadedPaths);
    }

    if (!cloudWorkspaceId) {
      await client.from('photos').delete().eq('workspace_id', workspaceId);
      await client.from('workspaces').delete().eq('id', workspaceId);
    }

    throw error;
  }
}

export async function deleteCloudWorkspaceById({ client, userId, workspaceId, workspaceRecords }: DeleteCloudWorkspaceOptions) {
  const rpcResult = await tryDeleteWorkspaceRpc(client, workspaceId);
  if (rpcResult) {
    await removeStoragePathsBestEffort(
      client,
      rpcResult.storagePaths,
      'Workspace RPC delete succeeded but storage cleanup failed.',
    );
    return;
  }

  const workspaceRecord = workspaceRecords.find((workspace) => workspace.id === workspaceId) ?? await fetchWorkspaceRecord(client, workspaceId);
  const storagePaths = compactStoragePaths(
    workspaceRecord.cover_url,
    ...(workspaceRecord.photos ?? []).flatMap((photo) => [photo.original_url, photo.preview_url]),
  );

  const { error: deletePhotosError } = await client.from('photos').delete().eq('workspace_id', workspaceId);
  if (deletePhotosError) {
    throw deletePhotosError;
  }

  const { error: deleteWorkspaceError } = await client
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)
    .eq('user_id', userId);

  if (deleteWorkspaceError) {
    throw deleteWorkspaceError;
  }

  if (storagePaths.length) {
    const { error: removeStorageError } = await client.storage.from(STORAGE_BUCKET).remove(storagePaths);
    if (removeStorageError) {
      console.warn('Cloud workspace deleted but storage cleanup failed.', removeStorageError);
    }
  }
}

export async function openCloudWorkspaceSession({ client, workspaceId, workspaceRecords, language }: OpenCloudWorkspaceOptions) {
  const workspaceRecord = workspaceRecords.find((workspace) => workspace.id === workspaceId) ?? await fetchHydratedWorkspace(client, workspaceId);
  return buildDetailedCloudSession(workspaceRecord, language);
}

export async function deleteCloudPhotoById({
  client,
  userId,
  workspaceId,
  photoId,
  workspaceRecords,
  language,
}: DeleteCloudPhotoOptions): Promise<DeleteCloudPhotoResult> {
  const rpcResult = await tryDeletePhotoRpc(client, workspaceId, photoId);
  if (rpcResult) {
    await removeStoragePathsBestEffort(
      client,
      rpcResult.storagePaths,
      'Photo RPC delete succeeded but storage cleanup failed.',
    );

    if (!rpcResult.workspaceId) {
      return {
        workspaceId: null,
        session: null,
      };
    }

    const nextWorkspace = await fetchHydratedWorkspace(client, rpcResult.workspaceId);

    return {
      workspaceId: rpcResult.workspaceId,
      session: await buildDetailedCloudSession(nextWorkspace, language),
    };
  }

  const workspaceRecord = workspaceRecords.find((workspace) => workspace.id === workspaceId) ?? await fetchHydratedWorkspace(client, workspaceId);
  const targetPhoto = workspaceRecord.photos.find((photo) => photo.id === photoId);
  if (!targetPhoto) {
    throw new Error('Photo not found in cloud workspace.');
  }

  const { error: deletePhotoError } = await client
    .from('photos')
    .delete()
    .eq('id', photoId)
    .eq('workspace_id', workspaceId);

  if (deletePhotoError) {
    throw deletePhotoError;
  }

  const storagePaths = compactStoragePaths(targetPhoto.original_url, targetPhoto.preview_url);
  if (storagePaths.length) {
    const { error: removeStorageError } = await client.storage.from(STORAGE_BUCKET).remove(storagePaths);
    if (removeStorageError) {
      throw removeStorageError;
    }
  }

  const remainingPhotos = workspaceRecord.photos.filter((photo) => photo.id !== photoId);
  if (!remainingPhotos.length) {
    const { error: deleteWorkspaceError } = await client
      .from('workspaces')
      .delete()
      .eq('id', workspaceId)
      .eq('user_id', userId);

    if (deleteWorkspaceError) {
      throw deleteWorkspaceError;
    }

    return {
      workspaceId: null,
      session: null,
    };
  }

  const nextCoverPath = remainingPhotos[0]?.preview_url ?? remainingPhotos[0]?.original_url ?? null;
  const { error: updateWorkspaceError } = await client
    .from('workspaces')
    .update({
      cover_url: nextCoverPath,
      updated_at: new Date().toISOString(),
    })
    .eq('id', workspaceId)
    .eq('user_id', userId);

  if (updateWorkspaceError) {
    throw updateWorkspaceError;
  }

  const nextWorkspace = await fetchHydratedWorkspace(client, workspaceId);

  return {
    workspaceId,
    session: await buildDetailedCloudSession(nextWorkspace, language),
  };
}

export function buildCloudSessions(workspaceRecords: ResolvedCloudWorkspaceRecord[], language: Language) {
  return workspaceRecords
    .map((workspace) => toCloudSession(workspace, language))
    .filter((session): session is SessionItem => Boolean(session));
}
