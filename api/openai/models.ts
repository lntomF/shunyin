import {
  DEFAULT_OPENAI_BASE_URL,
  endpointUrl,
  getAuthHeaders,
  getProviderConfig,
  getServerErrorBody,
  jsonResponse,
  normalizeModels,
  optionsResponse,
  readJsonBody,
  createProviderFailureBody,
  type OpenAIModelsResponse,
} from '../_openaiRelay';

async function handleRequest(request: Request) {
  if (request.method === 'OPTIONS') return optionsResponse();

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  try {
    const body = await readJsonBody(request);
    const { apiKey } = getProviderConfig(body);
    const response = await fetch(endpointUrl('/models'), {
      method: 'GET',
      headers: getAuthHeaders(apiKey),
    });

    const responseBody = await response.json().catch(() => null) as OpenAIModelsResponse | null;

    if (!response.ok) {
      const failure = createProviderFailureBody(response.status, responseBody);
      return jsonResponse(failure, response.status);
    }

    return jsonResponse({
      ...normalizeModels(responseBody),
      baseUrl: DEFAULT_OPENAI_BASE_URL,
    });
  } catch (error) {
    return jsonResponse(getServerErrorBody(error, 'Model request failed.'), error instanceof SyntaxError ? 400 : 500);
  }
}

export default {
  fetch: handleRequest,
};
