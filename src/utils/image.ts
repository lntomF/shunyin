import { parse as parseExif } from 'exifr';
import type { ExifData, Language, WorkspaceImage } from '../types/app';
import { deriveBaseName, formatBytes, formatResolution } from './format';

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

interface ImportedImagePayload {
  image: WorkspaceImage;
  baseName: string;
  fileSizeLabel: string;
  resolutionLabel: string;
  exifOverrides: Partial<ExifData>;
}

interface ParsedExifTags {
  Make?: unknown;
  Model?: unknown;
  LensModel?: unknown;
  LensInfo?: unknown;
  LensSpecification?: unknown;
  FNumber?: unknown;
  ApertureValue?: unknown;
  ExposureTime?: unknown;
  ShutterSpeedValue?: unknown;
  ISO?: unknown;
  PhotographicSensitivity?: unknown;
  ISOSpeedRatings?: unknown;
  ColorSpace?: unknown;
  BitsPerSample?: unknown;
  BitDepth?: unknown;
  MeteringMode?: unknown;
  FocusMode?: unknown;
  AFMode?: unknown;
}

type ExifSource = File | Blob;

export async function loadImageElement(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//i.test(src)) {
      image.crossOrigin = 'anonymous';
    }
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image.'));
    image.src = src;
  });
}

function blobToDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }

      reject(new Error('Failed to convert blob to data URL.'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read blob.'));
    reader.readAsDataURL(blob);
  });
}

export async function createScaledDataUrl(
  src: string,
  maxEdge: number,
  mimeType = 'image/jpeg',
  quality = 0.88,
) {
  const image = await loadImageElement(src);
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas unavailable.');
  }

  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL(mimeType, quality);
}

function asText(value: unknown) {
  if (typeof value === 'string') {
    const text = value.trim();
    return text || undefined;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  if (Array.isArray(value)) {
    const text = value.map(asText).filter(Boolean).join(' ');
    return text || undefined;
  }

  return undefined;
}

function asNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = asNumber(item);
      if (parsed !== undefined) {
        return parsed;
      }
    }
  }

  return undefined;
}

function dedupeCameraLabel(make?: string, model?: string) {
  if (make && model) {
    const lowerMake = make.toLowerCase();
    const lowerModel = model.toLowerCase();
    if (lowerModel.startsWith(lowerMake)) {
      return model;
    }

    return `${make} ${model}`;
  }

  return make ?? model;
}

function formatDecimal(value: number, digits = 1) {
  return Number.isInteger(value) ? String(value) : value.toFixed(digits).replace(/\.0$/, '');
}

function formatAperture(value: unknown) {
  const numeric = asNumber(value);
  if (numeric !== undefined && numeric > 0) {
    return `f/${formatDecimal(numeric, 1)}`;
  }

  const text = asText(value);
  if (!text) {
    return undefined;
  }

  return text.toLowerCase().startsWith('f/') ? text : `f/${text}`;
}

function formatShutter(value: unknown) {
  const numeric = asNumber(value);
  if (numeric !== undefined && numeric > 0) {
    if (numeric >= 1) {
      return `${formatDecimal(numeric, 1)}s`;
    }

    const denominator = Math.round(1 / numeric);
    return denominator > 1 ? `1/${denominator}` : `${formatDecimal(numeric, 2)}s`;
  }

  return asText(value);
}

function formatIso(value: unknown) {
  const numeric = asNumber(value);
  if (numeric !== undefined && numeric > 0) {
    return String(Math.round(numeric));
  }

  return asText(value);
}

function formatBitDepth(value: unknown) {
  if (Array.isArray(value)) {
    const numericValues = value.map(asNumber).filter((item): item is number => item !== undefined);
    if (!numericValues.length) {
      return asText(value);
    }

    const unique = Array.from(new Set(numericValues));
    return unique.length === 1 ? `${unique[0]}-bit` : `${unique.join('/')} bit`;
  }

  const numeric = asNumber(value);
  if (numeric !== undefined && numeric > 0) {
    return `${numeric}-bit`;
  }

  return asText(value);
}

function formatColorSpace(value: unknown) {
  const text = asText(value);
  if (!text) {
    return undefined;
  }

  if (text === '1') {
    return 'sRGB';
  }

  if (text === '65535') {
    return 'Uncalibrated';
  }

  return text;
}

async function parseExifOverrides(source: ExifSource): Promise<Partial<ExifData>> {
  const metadata = await parseExif(source, {
    tiff: true,
    ifd0: {},
    exif: true,
    gps: false,
    interop: false,
    xmp: false,
    icc: false,
    iptc: false,
    jfif: false,
    ihdr: false,
    sanitize: true,
    mergeOutput: true,
    translateKeys: true,
    translateValues: true,
    reviveValues: true,
  }) as ParsedExifTags | undefined;

  if (!metadata) {
    return {};
  }

  return {
    cameraBody: dedupeCameraLabel(asText(metadata.Make), asText(metadata.Model)),
    lens: asText(metadata.LensModel) ?? asText(metadata.LensInfo) ?? asText(metadata.LensSpecification),
    aperture: formatAperture(metadata.FNumber ?? metadata.ApertureValue),
    shutter: formatShutter(metadata.ExposureTime ?? metadata.ShutterSpeedValue),
    iso: formatIso(metadata.ISO ?? metadata.PhotographicSensitivity ?? metadata.ISOSpeedRatings),
    colorSpace: formatColorSpace(metadata.ColorSpace),
    bitDepth: formatBitDepth(metadata.BitsPerSample ?? metadata.BitDepth),
    metering: asText(metadata.MeteringMode),
    focusMode: asText(metadata.FocusMode) ?? asText(metadata.AFMode),
  };
}

async function readExifOverrides(file: File): Promise<Partial<ExifData>> {
  return parseExifOverrides(file);
}

const dataUrlCache = new Map<string, Promise<string>>();

export function resolveImageDataUrl(src: string) {
  if (!/^https?:\/\//i.test(src)) {
    return Promise.resolve(src);
  }

  const cached = dataUrlCache.get(src);
  if (cached) {
    return cached;
  }

  const pending = fetch(src)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch image source: ${response.status}`);
      }

      return response.blob();
    })
    .then(blobToDataUrl)
    .catch((error) => {
      dataUrlCache.delete(src);
      throw error;
    });

  dataUrlCache.set(src, pending);
  return pending;
}

export function getLocalExifFallbacks(language: Language): Omit<ExifData, 'fileSize' | 'resolution'> {
  if (language === 'zh') {
    return {
      cameraBody: '未检测到机身信息',
      lens: '未检测到镜头信息',
      aperture: '--',
      shutter: '--',
      iso: '--',
      colorSpace: '未检测到色彩空间',
      bitDepth: '未检测到位深',
      metering: '未检测到测光模式',
      focusMode: '已导入照片',
    };
  }

  return {
    cameraBody: 'Camera info unavailable',
    lens: 'Lens info unavailable',
    aperture: '--',
    shutter: '--',
    iso: '--',
    colorSpace: 'Color space unavailable',
    bitDepth: 'Bit depth unavailable',
    metering: 'Metering unavailable',
    focusMode: 'Photo imported',
  };
}

export async function readExifOverridesFromBlob(blob: Blob) {
  return parseExifOverrides(blob);
}

export async function readExifOverridesFromUrl(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch EXIF source: ${response.status}`);
  }

  const blob = await response.blob();
  return readExifOverridesFromBlob(blob);
}

function createImageId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `img-${crypto.randomUUID()}`;
  }

  return `img-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function importImageFile(file: File, objectUrl: string, language: Language): Promise<ImportedImagePayload> {
  const preview = await loadImageElement(objectUrl);
  const persistedSrc = await createScaledDataUrl(objectUrl, 1600, 'image/jpeg', 0.9);
  const baseName = deriveBaseName(file.name);
  const createdAt = new Date().toISOString();
  const exifOverrides = await readExifOverrides(file);

  return {
    image: {
      id: createImageId(),
      name: baseName,
      src: objectUrl,
      persistedSrc,
      objectUrl,
      width: preview.naturalWidth,
      height: preview.naturalHeight,
      sizeBytes: file.size,
      mimeType: file.type,
      source: 'local',
      createdAt,
    },
    baseName,
    fileSizeLabel: formatBytes(file.size, language),
    resolutionLabel: formatResolution(preview.naturalWidth, preview.naturalHeight, file.type, language),
    exifOverrides,
  };
}
