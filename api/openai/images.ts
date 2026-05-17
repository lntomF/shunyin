import {
  createCompletedJob,
  createFailedJob,
  createImageRequestPayload,
  getProviderConfig,
  getServerErrorBody,
  readNodeJsonBody,
  requestGeneratedImage,
  sendNodeJson,
  sendNodeOptions,
} from '../_openaiRelay';

export const maxDuration = 60;

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
    const { model, prompt, payload } = createImageRequestPayload(body);
    const generated = await requestGeneratedImage({
      apiKey,
      model,
      prompt,
      payload,
    });

    if (!generated.ok) {
      sendNodeJson(response, {
        job: createFailedJob({
          prompt,
          model,
          error: generated.failure,
        }),
      }, 202);
      return;
    }

    sendNodeJson(response, {
      job: createCompletedJob({
        prompt,
        model,
        result: generated.result,
      }),
    }, 202);
  } catch (error) {
    const status = error instanceof SyntaxError ? 400 : error instanceof Error && error.message === 'missing_prompt' ? 400 : 500;
    sendNodeJson(response, getServerErrorBody(error, 'Image generation failed.'), status);
  }
}
