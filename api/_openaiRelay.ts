import { randomUUID } from 'node:crypto';

export const DEFAULT_OPENAI_BASE_URL = 'https://api.shunyin.eu.cc/v1';
export const DEFAULT_IMAGE_MODEL = 'gpt-image-1.5';
export const DEFAULT_IMAGE_SIZE = '1024x1024';
export const MAX_RETRY_ATTEMPTS = 3;
export const INITIAL_RETRY_DELAY = 1000; // 1秒
export const REQUEST_TIMEOUT = 90000; // 90秒

const ALLOWED_IMAGE_QUALITIES = new Set(['low', 'medium', 'high', 'auto']);
const ALLOWED_ASPECT_RATIOS = new Set(['auto', '1:1', '16:9', '9:16', '4:3', '3:4']);

export interface OpenAIModel {
  id?: unknown;
  object?: unknown;
  created?: unknown;
  owned_by?: unknown;
}

export interface OpenAIModelsResponse {
  data?: OpenAIModel[];
}

export interface OpenAIImageResponse {
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

export type ImageGenerationJobStatus = 'queued' | 'running' | 'succeeded' | 'failed';

export interface ProviderFailureBody {
  error: string;
  message: string;
  providerMessage?: string;
  statusCode?: number;
}

export interface ImageGenerationJob {
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

export function redactSensitiveText(value: string, apiKey?: string) {
  let redacted = value;
  const trimmedKey = apiKey?.trim();

  if (trimmedKey) {
    redacted = redacted.split(trimmedKey).join('[redacted]');
  }

  return redacted
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]{12,}/gi, 'Bearer [redacted]')
    .replace(/\b(?:sk|sess|rk|pk|org|proj)-[A-Za-z0-9._-]{12,}\b/g, '[redacted]')
    .replace(/\b[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}\b/g, '[redacted]');
}

export function redactSensitiveBody<T>(body: T, apiKey?: string): T {
  if (typeof body === 'string') {
    return redactSensitiveText(body, apiKey) as T;
  }

  if (Array.isArray(body)) {
    return body.map((item) => redactSensitiveBody(item, apiKey)) as T;
  }

  if (body && typeof body === 'object') {
    return Object.fromEntries(
      Object.entries(body).map(([key, value]) => [key, redactSensitiveBody(value, apiKey)]),
    ) as T;
  }

  return body;
}

export function jsonResponse(body: unknown, status = 200) {
  return Response.json(redactSensitiveBody(body), {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

export function optionsResponse() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'no-store',
    },
  });
}

export function sendNodeJson(response: any, body: unknown, status = 200) {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Cache-Control', 'no-store');
  response.end(JSON.stringify(redactSensitiveBody(body)));
}

export function sendNodeOptions(response: any) {
  response.statusCode = 204;
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Cache-Control', 'no-store');
  response.end();
}

export async function readJsonBody(request: Request) {
  const text = await request.text();
  if (!text.trim()) {
    return {};
  }

  return JSON.parse(text) as Record<string, unknown>;
}

export async function readNodeJsonBody(request: any) {
  const requestBody = request.body;
  if (requestBody && typeof requestBody === 'object' && !Buffer.isBuffer(requestBody)) {
    return requestBody as Record<string, unknown>;
  }

  if (typeof requestBody === 'string') {
    return requestBody.trim() ? JSON.parse(requestBody) as Record<string, unknown> : {};
  }

  if (Buffer.isBuffer(requestBody)) {
    const text = requestBody.toString('utf8');
    return text.trim() ? JSON.parse(text) as Record<string, unknown> : {};
  }

  let raw = '';
  for await (const chunk of request) {
    raw += chunk;
  }

  return raw.trim() ? JSON.parse(raw) as Record<string, unknown> : {};
}

export function asTrimmedString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function asAllowedValue(value: unknown, allowedValues: Set<string>, fallback: string) {
  return typeof value === 'string' && allowedValues.has(value) ? value : fallback;
}

export function getProviderConfig(body: Record<string, unknown>) {
  const apiKey = asTrimmedString(body.apiKey);

  if (!apiKey) {
    throw new Error('missing_openai_api_key');
  }

  if (apiKey.startsWith('ghp_')) {
    throw new Error('github_token_used_as_openai_key');
  }

  return { apiKey };
}

export function getAuthHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

export function endpointUrl(pathName: string) {
  return `${DEFAULT_OPENAI_BASE_URL.replace(/\/+$/, '')}/${pathName.replace(/^\/+/, '')}`;
}

export function getOpenAiErrorMessage(errorBody: unknown) {
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

export function isProviderTimeout(status: number, message: string) {
  return status === 524 || /status_code\s*=\s*524|bad response status code 524|timeout|timed out/i.test(message);
}

export function shouldRetry(status: number, attempt: number): boolean {
  if (attempt >= MAX_RETRY_ATTEMPTS) return false;
  // 可重试的状态码：408 请求超时, 429 限流, 500+ 服务器错误, 524 超时
  return status === 408 || status === 429 || status === 524 || (status >= 500 && status < 600);
}

export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function calculateBackoff(attempt: number): number {
  // 指数退避：1s, 2s, 4s
  return INITIAL_RETRY_DELAY * Math.pow(2, attempt);
}

async function retryWithBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  maxAttempts: number,
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await operation(attempt);
    } catch (error: any) {
      lastError = error;

      // 如果不可重试或已达最大重试次数，直接抛出
      if (!error.retryable || attempt === maxAttempts - 1) {
        break;
      }

      // 计算退避时间并等待
      const backoffMs = calculateBackoff(attempt);
      await sleep(backoffMs);
    }
  }

  // 所有重试都失败，返回最终错误
  const status = lastError?.status || 500;
  return {
    ok: false as const,
    status,
    failure: {
      error: status === 524 ? 'provider_timeout' : 'openai_request_failed',
      message: lastError?.message || 'Request failed after multiple retries.',
      statusCode: status,
    },
  } as T;
}

export function createProviderFailureBody(status: number, responseBody: unknown, apiKey?: string): ProviderFailureBody {
  const message = getOpenAiErrorMessage(responseBody);
  const safeMessage = redactSensitiveText(message, apiKey);
  const timeout = isProviderTimeout(status, message);

  return {
    error: timeout ? 'provider_timeout' : 'openai_request_failed',
    message: timeout
      ? 'The Xi API relay timed out while waiting for the upstream image model. Try another model or retry later.'
      : safeMessage,
    providerMessage: safeMessage,
    statusCode: status,
  };
}

export function getServerErrorBody(error: unknown, fallback = 'Request failed.', apiKey?: string) {
  const message = error instanceof Error ? error.message : fallback;
  const safeMessage = redactSensitiveText(message, apiKey);

  return {
    error: message === 'missing_openai_api_key'
      ? 'missing_openai_api_key'
      : message === 'github_token_used_as_openai_key'
        ? 'invalid_openai_api_key'
        : 'request_failed',
    message: message === 'missing_openai_api_key'
      ? 'Enter an API key in the page before making this request.'
      : message === 'github_token_used_as_openai_key'
        ? 'The API key looks like a GitHub token. Use an OpenAI-compatible API key instead.'
        : safeMessage,
  };
}

export function isLikelyImageModel(modelId: string) {
  return /image|img|gpt-image|dall|flux|midjourney|mj|seedream|jimeng|cogview|imagen|ideogram|recraft|kling/i.test(modelId);
}

export function normalizeModels(responseBody: OpenAIModelsResponse | null) {
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

export async function resolveImagePayload(image: NonNullable<OpenAIImageResponse['data']>[number]) {
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
      imageBase64: Buffer.from(await imageResponse.arrayBuffer()).toString('base64'),
      mimeType: imageResponse.headers.get('content-type') || 'image/png',
    };
  }

  return null;
}

export function createImageRequestPayload(body: Record<string, unknown>) {
  const model = asTrimmedString(body.model) || DEFAULT_IMAGE_MODEL;
  const prompt = asTrimmedString(body.prompt);

  if (!prompt) {
    throw new Error('missing_prompt');
  }

  const aspectRatio = asAllowedValue(body.aspectRatio, ALLOWED_ASPECT_RATIOS, 'auto');
  const quality = asAllowedValue(body.quality, ALLOWED_IMAGE_QUALITIES, 'medium');
  const payload: Record<string, string | number> = {
    model,
    prompt,
    n: 1,
    size: DEFAULT_IMAGE_SIZE,
    quality,
    output_format: 'png',
  };

  if (aspectRatio !== 'auto') {
    payload.aspect_ratio = aspectRatio;
  }

  return { model, prompt, payload };
}

export function createImageEditRequestPayload(body: Record<string, unknown>) {
  const model = asTrimmedString(body.model) || DEFAULT_IMAGE_MODEL;
  const prompt = asTrimmedString(body.prompt);
  const image = asTrimmedString(body.image);

  if (!prompt) {
    throw new Error('missing_prompt');
  }

  if (!image) {
    throw new Error('missing_image');
  }

  const aspectRatio = asAllowedValue(body.aspectRatio, ALLOWED_ASPECT_RATIOS, 'auto');
  const quality = asAllowedValue(body.quality, ALLOWED_IMAGE_QUALITIES, 'medium');
  const payload: Record<string, string | number> = {
    model,
    prompt,
    image,
    n: 1,
    size: DEFAULT_IMAGE_SIZE,
    quality,
    output_format: 'png',
  };

  if (aspectRatio !== 'auto') {
    payload.aspect_ratio = aspectRatio;
  }

  return { model, prompt, payload };
}

export async function requestGeneratedImage({
  apiKey,
  model,
  prompt,
  payload,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  payload: Record<string, string | number>;
}) {
  return await retryWithBackoff(async (attempt) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(endpointUrl('/images/generations'), {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = await handleImageResponse(response, apiKey, model, prompt);

      // 如果失败且可重试，抛出错误触发重试
      if (!result.ok && shouldRetry(result.status, attempt)) {
        const error = new Error(result.failure.message) as any;
        error.status = result.status;
        error.retryable = true;
        throw error;
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timed out after 90 seconds') as any;
        timeoutError.status = 524;
        timeoutError.retryable = shouldRetry(524, attempt);
        throw timeoutError;
      }

      throw error;
    }
  }, MAX_RETRY_ATTEMPTS);
}

async function handleImageResponse(
  response: Response,
  apiKey: string,
  model: string,
  prompt: string,
) {

  const responseBody = await response.json().catch(() => null) as OpenAIImageResponse | null;

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      failure: createProviderFailureBody(response.status, responseBody, apiKey),
    };
  }

  const image = responseBody?.data?.[0];
  if (!image) {
    return {
      ok: false as const,
      status: 502,
      failure: {
        error: 'missing_image_data',
        message: 'OpenAI returned no image data.',
        statusCode: 502,
      },
    };
  }

  const imagePayload = await resolveImagePayload(image);
  if (!imagePayload) {
    return {
      ok: false as const,
      status: 502,
      failure: {
        error: 'missing_image_data',
        message: 'The image provider returned neither b64_json nor url.',
        statusCode: 502,
      },
    };
  }

  return {
    ok: true as const,
    result: {
      ...imagePayload,
      revisedPrompt: image.revised_prompt,
      model,
      size: responseBody?.size ?? DEFAULT_IMAGE_SIZE,
      usage: responseBody?.usage,
    },
    prompt,
  };
}

export async function requestEditedImage({
  apiKey,
  model,
  prompt,
  payload,
}: {
  apiKey: string;
  model: string;
  prompt: string;
  payload: Record<string, string | number>;
}) {
  return await retryWithBackoff(async (attempt) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(endpointUrl('/images/edits'), {
        method: 'POST',
        headers: getAuthHeaders(apiKey),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const result = await handleImageResponse(response, apiKey, model, prompt);

      if (!result.ok && shouldRetry(result.status, attempt)) {
        const error = new Error(result.failure.message) as any;
        error.status = result.status;
        error.retryable = true;
        throw error;
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timed out after 90 seconds') as any;
        timeoutError.status = 524;
        timeoutError.retryable = shouldRetry(524, attempt);
        throw timeoutError;
      }

      throw error;
    }
  }, MAX_RETRY_ATTEMPTS);
}

export function createCompletedJob({
  prompt,
  model,
  result,
}: {
  prompt: string;
  model: string;
  result: NonNullable<ImageGenerationJob['result']>;
}): ImageGenerationJob {
  const now = Date.now();

  return {
    id: randomUUID(),
    status: 'succeeded',
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 30 * 60 * 1000,
    prompt,
    model,
    result,
  };
}

export function createFailedJob({
  prompt,
  model,
  error,
}: {
  prompt: string;
  model: string;
  error: ProviderFailureBody;
}): ImageGenerationJob {
  const now = Date.now();

  return {
    id: randomUUID(),
    status: 'failed',
    createdAt: now,
    updatedAt: now,
    expiresAt: now + 30 * 60 * 1000,
    prompt,
    model,
    error,
  };
}
