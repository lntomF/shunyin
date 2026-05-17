import {
  DEFAULT_OPENAI_BASE_URL,
  endpointUrl,
  getAuthHeaders,
  getProviderConfig,
  getServerErrorBody,
  sendNodeJson,
  sendNodeOptions,
  normalizeModels,
  readNodeJsonBody,
  createProviderFailureBody,
  type OpenAIModelsResponse,
} from '../_openaiRelay';

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
    const body = await readNodeJsonBody(request);
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
    sendNodeJson(response, getServerErrorBody(error, 'Model request failed.'), error instanceof SyntaxError ? 400 : 500);
  }
}
