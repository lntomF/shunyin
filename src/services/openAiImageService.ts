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

interface EditOpenAiImageOptions {
  apiKey: string;
  model: string;
  prompt: string;
  image: File;
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

interface CreateOpenAiImageJobResponse {
  job?: OpenAiImageJob;
  message?: string;
  error?: string;
  providerMessage?: string;
}

interface FetchOpenAiImageJobResponse {
  job?: OpenAiImageJob;
  message?: string;
  error?: string;
  providerMessage?: string;
}

export type OpenAiImageJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface OpenAiImageJob {
  id: string;
  status: OpenAiImageJobStatus;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  prompt: string;
  model: string;
  result?: {
    imageBase64: string;
    mimeType?: string;
    revisedPrompt?: string;
    model?: string;
    size?: string;
  };
  error?: {
    error?: string;
    message?: string;
    providerMessage?: string;
    statusCode?: number;
  };
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

function requireJob(body: CreateOpenAiImageJobResponse | FetchOpenAiImageJobResponse | null, fallback: string) {
  if (!body?.job) {
    throw new Error(getErrorMessage(body, fallback));
  }

  return body.job;
}

function imageBase64ToGeneratedImage({
  imageBase64,
  mimeType = 'image/png',
  prompt,
  model,
  revisedPrompt,
  size,
}: {
  imageBase64: string;
  mimeType?: string;
  prompt: string;
  model?: string;
  revisedPrompt?: string;
  size?: string;
}): GeneratedOpenAiImage {
  const blob = base64ToBlob(imageBase64, mimeType);
  const safeName = sanitizeFileName(prompt).slice(0, 46) || 'openai-image';
  const file = new File([blob], `${safeName || 'openai-image'}.png`, {
    type: mimeType,
    lastModified: Date.now(),
  });

  return {
    file,
    objectUrl: URL.createObjectURL(blob),
    revisedPrompt,
    model,
    size,
  };
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
  const response = await fetch('/api/openai/images/sync', {
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

  return imageBase64ToGeneratedImage({
    imageBase64: body.imageBase64,
    mimeType: body.mimeType,
    prompt,
    model: body.model,
    revisedPrompt: body.revisedPrompt,
    size: body.size,
  });
}

export async function createOpenAiImageJob({
  apiKey,
  model,
  prompt,
  aspectRatio,
  quality,
}: GenerateOpenAiImageOptions): Promise<OpenAiImageJob> {
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

  const body = await response.json().catch(() => null) as CreateOpenAiImageJobResponse | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Image job creation failed.'));
  }

  return requireJob(body, 'Image job creation failed.');
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function createOpenAiImageEditJob({
  apiKey,
  model,
  prompt,
  image,
  aspectRatio,
  quality,
}: EditOpenAiImageOptions): Promise<OpenAiImageJob> {
  const imageBase64 = await fileToBase64(image);

  const response = await fetch('/api/openai/images/edit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey,
      model,
      prompt,
      image: imageBase64,
      size: DEFAULT_IMAGE_SIZE,
      aspectRatio,
      quality,
    }),
  });

  const body = await response.json().catch(() => null) as CreateOpenAiImageJobResponse | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Image edit job creation failed.'));
  }

  return requireJob(body, 'Image edit job creation failed.');
}

export async function fetchOpenAiImageJob(jobId: string): Promise<OpenAiImageJob> {
  const response = await fetch(`/api/openai/image-jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
  });

  const body = await response.json().catch(() => null) as FetchOpenAiImageJobResponse | null;

  if (!response.ok) {
    throw new Error(getErrorMessage(body, 'Image job status request failed.'));
  }

  return requireJob(body, 'Image job status request failed.');
}

export function openAiImageJobToGeneratedImage(job: OpenAiImageJob): GeneratedOpenAiImage {
  if (!job.result?.imageBase64) {
    throw new Error(job.error?.message || 'Image generation job has no image result.');
  }

  return imageBase64ToGeneratedImage({
    imageBase64: job.result.imageBase64,
    mimeType: job.result.mimeType,
    prompt: job.prompt,
    model: job.result.model || job.model,
    revisedPrompt: job.result.revisedPrompt,
    size: job.result.size,
  });
}
