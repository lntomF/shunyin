import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import path from 'path';
import { defineConfig, loadEnv, type Plugin } from 'vite';

const DEFAULT_OPENAI_BASE_URL = 'https://api.shunyin.eu.cc/v1';
const DEFAULT_IMAGE_MODEL = 'gpt-image-1.5';
const DEFAULT_IMAGE_SIZE = '1024x1024';
const ALLOWED_IMAGE_QUALITIES = new Set(['low', 'medium', 'high', 'auto']);
const ALLOWED_ASPECT_RATIOS = new Set(['auto', '1:1', '16:9', '9:16', '4:3', '3:4']);
const MAX_REQUEST_BYTES = 24 * 1024 * 1024;
const IMAGE_JOB_TTL_MS = 30 * 60 * 1000;
const MAX_IMAGE_JOBS = 80;

interface ImageGenerationRequest {
  apiKey?: unknown;
  model?: unknown;
  prompt?: unknown;
  size?: unknown;
  aspectRatio?: unknown;
  quality?: unknown;
}

interface ModelsRequest {
  apiKey?: unknown;
}

interface OpenAIModel {
  id?: unknown;
  object?: unknown;
  created?: unknown;
  owned_by?: unknown;
}

interface OpenAIModelsResponse {
  data?: OpenAIModel[];
}

interface OpenAIImageResponse {
  error?: {
    message?: string;
    type?: string;
    code?: string | number;
  };
  message?: string;
  data?: Array<{
    b64_json?: string;
    url?: string;
    revised_prompt?: string;
  }>;
  output_format?: string;
  size?: string;
  usage?: unknown;
}

type ImageGenerationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

interface ProviderFailureBody {
  error: string;
  message: string;
  providerMessage?: string;
  statusCode?: number;
}

interface ImageGenerationJob {
  id: string;
  status: ImageGenerationJobStatus;
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
    usage?: unknown;
  };
  error?: ProviderFailureBody;
}

const imageGenerationJobs = new Map<string, ImageGenerationJob>();

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(body));
}

async function readJsonBody(req: IncomingMessage): Promise<ImageGenerationRequest> {
  let raw = '';

  for await (const chunk of req) {
    raw += chunk;
    if (Buffer.byteLength(raw) > MAX_REQUEST_BYTES) {
      throw new Error('request_too_large');
    }
  }

  if (!raw.trim()) {
    return {};
  }

  return JSON.parse(raw) as ImageGenerationRequest;
}

function asAllowedValue(value: unknown, allowedValues: Set<string>, fallback: string) {
  return typeof value === 'string' && allowedValues.has(value) ? value : fallback;
}

function asTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function addAspectRatio(payload: Record<string, string | number>, aspectRatio: string) {
  if (aspectRatio !== 'auto') {
    payload.aspect_ratio = aspectRatio;
  }

  return payload;
}

function endpointUrl(baseUrl: string, pathName: string) {
  return `${baseUrl.replace(/\/+$/, '')}/${pathName.replace(/^\/+/, '')}`;
}

function getOpenAiErrorMessage(errorBody: unknown) {
  if (
    errorBody &&
    typeof errorBody === 'object' &&
    'message' in errorBody &&
    typeof errorBody.message === 'string'
  ) {
    return errorBody.message;
  }

  if (
    errorBody &&
    typeof errorBody === 'object' &&
    'error' in errorBody &&
    errorBody.error &&
    typeof errorBody.error === 'object' &&
    'message' in errorBody.error &&
    typeof errorBody.error.message === 'string'
  ) {
    return errorBody.error.message;
  }

  return 'OpenAI image generation failed.';
}

function isProviderTimeout(status: number, message: string) {
  return status === 524 || /status_code\s*=\s*524|bad response status code 524|timeout|timed out/i.test(message);
}

function createProviderFailureBody(status: number, responseBody: unknown): ProviderFailureBody {
  const message = getOpenAiErrorMessage(responseBody);
  const timeout = isProviderTimeout(status, message);

  return {
    error: timeout ? 'provider_timeout' : 'openai_request_failed',
    message: timeout
      ? 'The SHUNYIN relay timed out while waiting for the upstream image model. The job failed; try another model or retry later.'
      : message,
    providerMessage: message,
    statusCode: status,
  };
}

function sendProviderFailure(res: ServerResponse, status: number, responseBody: unknown) {
  sendJson(res, status, createProviderFailureBody(status, responseBody));
}

function getServerErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return 'Image generation failed.';
  }

  const cause = error.cause;
  if (cause instanceof Error && cause.message) {
    return `${error.message}: ${cause.message}`;
  }

  return error.message;
}

function getAuthHeaders(apiKey: string, organization?: string, project?: string) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  if (organization) {
    headers['OpenAI-Organization'] = organization;
  }

  if (project) {
    headers['OpenAI-Project'] = project;
  }

  return headers;
}

function isLikelyImageModel(modelId: string) {
  return /image|img|gpt-image|dall|flux|midjourney|mj|seedream|jimeng|cogview|imagen|ideogram|recraft|kling/i.test(modelId);
}

function normalizeModels(responseBody: OpenAIModelsResponse | null) {
  const models = (responseBody?.data ?? [])
    .map((model) => {
      const id = typeof model.id === 'string' ? model.id : '';
      if (!id) {
        return null;
      }

      return {
        id,
        object: typeof model.object === 'string' ? model.object : undefined,
        created: typeof model.created === 'number' ? model.created : undefined,
        ownedBy: typeof model.owned_by === 'string' ? model.owned_by : undefined,
      };
    })
    .filter((model): model is NonNullable<typeof model> => Boolean(model))
    .sort((left, right) => left.id.localeCompare(right.id));

  return {
    models,
    imageModels: models.filter((model) => isLikelyImageModel(model.id)),
  };
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString('base64');
}

async function resolveImagePayload(image: NonNullable<OpenAIImageResponse['data']>[number]) {
  if (image.b64_json) {
    return {
      imageBase64: image.b64_json,
      mimeType: 'image/png',
    };
  }

  if (image.url) {
    const imageResponse = await fetch(image.url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to download generated image: ${imageResponse.status}`);
    }

    return {
      imageBase64: arrayBufferToBase64(await imageResponse.arrayBuffer()),
      mimeType: imageResponse.headers.get('content-type') || 'image/png',
    };
  }

  return null;
}

function pruneImageJobs() {
  const now = Date.now();

  for (const [id, job] of imageGenerationJobs) {
    if (job.expiresAt <= now) {
      imageGenerationJobs.delete(id);
    }
  }

  if (imageGenerationJobs.size <= MAX_IMAGE_JOBS) {
    return;
  }

  const jobsByAge = [...imageGenerationJobs.values()].sort((left, right) => left.createdAt - right.createdAt);
  const overflow = imageGenerationJobs.size - MAX_IMAGE_JOBS;

  for (const job of jobsByAge.slice(0, overflow)) {
    imageGenerationJobs.delete(job.id);
  }
}

function serializeImageJob(job: ImageGenerationJob) {
  return {
    id: job.id,
    status: job.status,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    expiresAt: job.expiresAt,
    prompt: job.prompt,
    model: job.model,
    result: job.result,
    error: job.error,
  };
}

function createOpenAiImagePlugin(env: Record<string, string>): Plugin {
  const baseUrl = DEFAULT_OPENAI_BASE_URL;
  const fallbackModel = env.OPENAI_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
  const organization = env.OPENAI_ORGANIZATION;
  const project = env.OPENAI_PROJECT;

  const readProviderConfig = (body: ImageGenerationRequest | ModelsRequest) => {
    const apiKey = asTrimmedString(body.apiKey);

    if (!apiKey) {
      throw new Error('missing_openai_api_key');
    }

    if (apiKey.startsWith('ghp_')) {
      throw new Error('github_token_used_as_openai_key');
    }

    return {
      apiKey,
    };
  };

  const handleListModels = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const { apiKey } = readProviderConfig(body);
      const response = await fetch(endpointUrl(baseUrl, '/models'), {
        method: 'GET',
        headers: getAuthHeaders(apiKey, organization, project),
      });

      const responseBody = await response.json().catch(() => null) as OpenAIModelsResponse | null;

      if (!response.ok) {
        sendProviderFailure(res, response.status, responseBody);
        return;
      }

      sendJson(res, 200, {
        ...normalizeModels(responseBody),
        baseUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Model request failed.';
      sendJson(res, 500, {
        error: message === 'missing_openai_api_key'
          ? 'missing_openai_api_key'
          : message === 'github_token_used_as_openai_key'
            ? 'invalid_openai_api_key'
            : 'model_request_failed',
        message: message === 'missing_openai_api_key'
          ? 'Enter an API key in the page before fetching models.'
          : message === 'github_token_used_as_openai_key'
            ? 'The API key looks like a GitHub token. Use an OpenAI-compatible API key instead.'
            : getServerErrorMessage(error),
      });
    }
  };

  const sendProviderImageRequest = async ({
    apiKey,
    payload,
  }: {
    apiKey: string;
    payload: Record<string, string | number>;
  }) => {
    return fetch(endpointUrl(baseUrl, '/images/generations'), {
      method: 'POST',
      headers: getAuthHeaders(apiKey, organization, project),
      body: JSON.stringify(payload),
    });
  };

  const runImageGenerationJob = async ({
    jobId,
    apiKey,
    payload,
  }: {
    jobId: string;
    apiKey: string;
    payload: Record<string, string | number>;
  }) => {
    const job = imageGenerationJobs.get(jobId);
    if (!job) {
      return;
    }

    job.status = 'running';
    job.updatedAt = Date.now();

    try {
      const openAiResponse = await sendProviderImageRequest({
        apiKey,
        payload,
      });

      const responseBody = await openAiResponse.json().catch(() => null) as OpenAIImageResponse | null;

      if (!openAiResponse.ok) {
        job.status = 'failed';
        job.error = createProviderFailureBody(openAiResponse.status, responseBody);
        job.updatedAt = Date.now();
        return;
      }

      const image = responseBody?.data?.[0];
      if (!image) {
        job.status = 'failed';
        job.error = {
          error: 'missing_image_data',
          message: 'OpenAI returned no image data.',
          statusCode: 502,
        };
        job.updatedAt = Date.now();
        return;
      }

      const imagePayload = await resolveImagePayload(image);
      if (!imagePayload) {
        job.status = 'failed';
        job.error = {
          error: 'missing_image_data',
          message: 'The image provider returned neither b64_json nor url.',
          statusCode: 502,
        };
        job.updatedAt = Date.now();
        return;
      }

      job.status = 'succeeded';
      job.result = {
        ...imagePayload,
        revisedPrompt: image.revised_prompt,
        model: job.model,
        size: responseBody?.size ?? DEFAULT_IMAGE_SIZE,
        usage: responseBody?.usage,
      };
      job.updatedAt = Date.now();
    } catch (error) {
      job.status = 'failed';
      job.error = {
        error: 'image_generation_failed',
        message: getServerErrorMessage(error),
        statusCode: 500,
      };
      job.updatedAt = Date.now();
    }
  };

  const handleCreateImageJob = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const { apiKey } = readProviderConfig(body);
      const model = asTrimmedString(body.model) || fallbackModel;
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

      if (!prompt) {
        sendJson(res, 400, { error: 'missing_prompt' });
        return;
      }

      const aspectRatio = asAllowedValue(body.aspectRatio, ALLOWED_ASPECT_RATIOS, 'auto');
      const quality = asAllowedValue(body.quality, ALLOWED_IMAGE_QUALITIES, 'medium');

      pruneImageJobs();

      const jobId = randomUUID();
      const now = Date.now();
      const payload = addAspectRatio({
        model,
        prompt,
        n: 1,
        size: DEFAULT_IMAGE_SIZE,
        quality,
        output_format: 'png',
      }, aspectRatio);

      const job: ImageGenerationJob = {
        id: jobId,
        status: 'queued',
        createdAt: now,
        updatedAt: now,
        expiresAt: now + IMAGE_JOB_TTL_MS,
        prompt,
        model,
      };

      imageGenerationJobs.set(jobId, job);
      void runImageGenerationJob({
        jobId,
        apiKey,
        payload,
      });

      sendJson(res, 202, {
        job: serializeImageJob(job),
      });
    } catch (error) {
      sendJson(res, error instanceof SyntaxError ? 400 : 500, {
        error: error instanceof SyntaxError ? 'invalid_json' : 'image_generation_failed',
        message: getServerErrorMessage(error),
      });
    }
  };

  const handleLegacyGenerateImage = async (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }

    try {
      const body = await readJsonBody(req);
      const { apiKey } = readProviderConfig(body);
      const model = asTrimmedString(body.model) || fallbackModel;
      const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

      if (!prompt) {
        sendJson(res, 400, { error: 'missing_prompt' });
        return;
      }

      const aspectRatio = asAllowedValue(body.aspectRatio, ALLOWED_ASPECT_RATIOS, 'auto');
      const quality = asAllowedValue(body.quality, ALLOWED_IMAGE_QUALITIES, 'medium');

      const openAiResponse = await sendProviderImageRequest({
        apiKey,
        payload: addAspectRatio({
          model,
          prompt,
          n: 1,
          size: DEFAULT_IMAGE_SIZE,
          quality,
          output_format: 'png',
        }, aspectRatio),
      });

      const responseBody = await openAiResponse.json().catch(() => null) as OpenAIImageResponse | null;

      if (!openAiResponse.ok) {
        sendProviderFailure(res, openAiResponse.status, responseBody);
        return;
      }

      const image = responseBody?.data?.[0];
      if (!image) {
        sendJson(res, 502, {
          error: 'missing_image_data',
          message: 'OpenAI returned no image data.',
        });
        return;
      }

      const imagePayload = await resolveImagePayload(image);
      if (!imagePayload) {
        sendJson(res, 502, {
          error: 'missing_image_data',
          message: 'The image provider returned neither b64_json nor url.',
        });
        return;
      }

      sendJson(res, 200, {
        ...imagePayload,
        revisedPrompt: image.revised_prompt,
        model,
        size: responseBody?.size ?? DEFAULT_IMAGE_SIZE,
        usage: responseBody?.usage,
      });
    } catch (error) {
      sendJson(res, error instanceof SyntaxError ? 400 : 500, {
        error: error instanceof SyntaxError ? 'invalid_json' : 'image_generation_failed',
        message: getServerErrorMessage(error),
      });
    }
  };

  const handleGetImageJob = (req: IncomingMessage, res: ServerResponse) => {
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== 'GET') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }

    pruneImageJobs();

    const requestPath = req.url?.split('?')[0] ?? '';
    const pathParts = requestPath.split('/').filter(Boolean);
    const jobId = pathParts.at(-1) ?? '';
    const job = imageGenerationJobs.get(jobId);

    if (!job) {
      sendJson(res, 404, {
        error: 'image_job_not_found',
        message: 'Image generation job was not found or has expired.',
      });
      return;
    }

    sendJson(res, 200, {
      job: serializeImageJob(job),
    });
  };

  return {
    name: 'shunyin-openai-image-api',
    configureServer(server) {
      server.middlewares.use('/api/openai/models', handleListModels);
      server.middlewares.use('/api/openai/image-jobs', handleGetImageJob);
      server.middlewares.use('/api/openai/images/sync', handleLegacyGenerateImage);
      server.middlewares.use('/api/openai/images', handleCreateImageJob);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/openai/models', handleListModels);
      server.middlewares.use('/api/openai/image-jobs', handleGetImageJob);
      server.middlewares.use('/api/openai/images/sync', handleLegacyGenerateImage);
      server.middlewares.use('/api/openai/images', handleCreateImageJob);
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [createOpenAiImagePlugin(env), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
