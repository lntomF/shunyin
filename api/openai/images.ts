import {
  createCompletedJob,
  createFailedJob,
  createImageRequestPayload,
  getProviderConfig,
  getServerErrorBody,
  jsonResponse,
  optionsResponse,
  readJsonBody,
  requestGeneratedImage,
} from '../_openaiRelay';

export const maxDuration = 60;

async function handleRequest(request: Request) {
  if (request.method === 'OPTIONS') return optionsResponse();

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  try {
    const body = await readJsonBody(request);
    const { apiKey } = getProviderConfig(body);
    const { model, prompt, payload } = createImageRequestPayload(body);
    const generated = await requestGeneratedImage({
      apiKey,
      model,
      prompt,
      payload,
    });

    if (!generated.ok) {
      return jsonResponse({
        job: createFailedJob({
          prompt,
          model,
          error: generated.failure,
        }),
      }, 202);
    }

    return jsonResponse({
      job: createCompletedJob({
        prompt,
        model,
        result: generated.result,
      }),
    }, 202);
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : error instanceof Error && error.message === 'missing_prompt' ? 400 : 500;
    return jsonResponse(getServerErrorBody(error, 'Image generation failed.'), status);
  }
}

export default {
  fetch: handleRequest,
};
