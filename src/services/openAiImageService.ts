import { sanitizeFileName } from '../utils/format';

export type GeneratedImageAspectRatio = 'auto' | '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
export type GeneratedImageQuality = 'medium';

export const SHUNYIN_IMAGE_API_BASE_URL = 'https://api.shunyin.eu.cc/v1';
export const SHUNYIN_API_KEY_STORAGE_KEY = 'shunyin.ai.apiKey.v1';
export const SHUNYIN_IMAGE_MODEL_STORAGE_KEY = 'shunyin.ai.imageModel.v1';

interface GenerateOpenAiImageOptions {
  apiKey: string;
  model: string;
  prompt: string;
  aspectRatio: GeneratedImageAspectRatio;
  quality: GeneratedImageQuality;
}

interface FetchOpenAiModelsOptions {
  apiKey: string;
}

export interface OpenAiProviderModel {
  id: string;
  object?: string;
  created?: number;
  ownedBy?: string;
}

interface FetchOpenAiModelsResponse {
  models?: OpenAiProviderModel[];
  imageModels?: OpenAiProviderModel[];
  baseUrl?: string;
  message?: string;
  error?: string;
  providerMessage?: string;
}

interface GenerateOpenAiImageResponse {
  imageBase64: string;
  mimeType?: string;
  revisedPrompt?: string;
  model?: string;
  size?: string;
  message?: string;
  error?: string;
  providerMessage?: string;
}

export interface GeneratedOpenAiImage {
  file: File;
  objectUrl: string;
  revisedPrompt?: string;
  model?: string;
  size?: string;
}

export const DEFAULT_IMAGE_SIZE = '1024x1024';

function base64ToBlob(base64: string, mimeType: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return new Blob([bytes], { type: mimeType });
}

function getErrorMessage(body: unknown, fallback: string) {
  if (
    body &&
    typeof body === 'object' &&
    'message' in body &&
    typeof body.message === 'string'
  ) {
    return body.message;
  }

  return fallback;
}

export async function fetchOpenAiModels({
  apiKey,
}: FetchOpenAiModelsOptions) {
  const response = await fetch('/api/openai/models', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
    }),
  });

  const body = await response.json().catch(() => null) as FetchOpenAiModelsResponse | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Failed to fetch models.'));
  }

  return {
    models: body?.models ?? [],
    imageModels: body?.imageModels ?? [],
    baseUrl: body?.baseUrl,
  };
}

export async function generateOpenAiImage({
  apiKey,
  model,
  prompt,
  aspectRatio,
  quality,
}: GenerateOpenAiImageOptions): Promise<GeneratedOpenAiImage> {
  const response = await fetch('/api/openai/images', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      model,
      prompt,
      size: DEFAULT_IMAGE_SIZE,
      aspectRatio,
      quality,
    }),
  });

  const body = await response.json().catch(() => null) as GenerateOpenAiImageResponse | null;

  if (!response.ok || !body?.imageBase64) {
    throw new Error(getErrorMessage(body, 'Image generation failed.'));
  }

  const mimeType = body.mimeType || 'image/png';
  const blob = base64ToBlob(body.imageBase64, mimeType);
  const safeName = sanitizeFileName(prompt).slice(0, 46) || 'openai-image';
  const file = new File([blob], `${safeName || 'openai-image'}.png`, {
    type: mimeType,
    lastModified: Date.now(),
  });

  return {
    file,
    objectUrl: URL.createObjectURL(blob),
    revisedPrompt: body.revisedPrompt,
    model: body.model,
    size: body.size,
  };
}
