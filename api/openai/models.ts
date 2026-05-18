import {
  DEFAULT_OPENAI_BASE_URL,
  endpointUrl,
  getAuthHeaders,
  getProviderConfig,
  getServerErrorBody,
  sendNodeJson,
  sendNodeOptions,
  normalizeModels,
  // readNodeJsonBody, // ❌ 注释掉或删除这个本地用的解析函数
  createProviderFailureBody,
  type OpenAIModelsResponse,
} from '../_openaiRelay.js';

export default async function handler(request: any, response: any) {
  if (request.method === 'OPTIONS') {
    sendNodeOptions(response);
    return;
  }

  if (request.method !== 'POST') {
    sendNodeJson(response, { error: 'method_not_allowed' }, 405);
    return;
  }

  try {
    // ✅ 关键修改：Vercel 已经自动解析了 JSON，直接安全读取 request.body 即可
    const body = typeof request.body === 'string' 
      ? JSON.parse(request.body) 
      : (request.body || {});

    const { apiKey } = getProviderConfig(body);
    
    const providerResponse = await fetch(endpointUrl('/models'), {
      method: 'GET',
      headers: getAuthHeaders(apiKey),
    });

    const responseBody = await providerResponse.json().catch(() => null) as OpenAIModelsResponse | null;

    if (!providerResponse.ok) {
      const failure = createProviderFailureBody(providerResponse.status, responseBody, apiKey);
      sendNodeJson(response, failure, providerResponse.status);
      return;
    }

    sendNodeJson(response, {
      ...normalizeModels(responseBody),
      baseUrl: DEFAULT_OPENAI_BASE_URL,
    });
  } catch (error) {
    sendNodeJson(
      response, 
      getServerErrorBody(error, 'Model request failed.'), 
      error instanceof SyntaxError ? 400 : 500
    );
  }
}