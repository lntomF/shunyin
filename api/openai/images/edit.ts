import {
  createCompletedJob,
  createFailedJob,
  createImageEditRequestPayload,
  getProviderConfig,
  requestEditedImage,
} from '../../_openaiRelay.js';

export const maxDuration = 60;

export default async function handler(request: any, response: any) {
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    const body = typeof request.body === 'string'
      ? JSON.parse(request.body)
      : (request.body || {});

    const { apiKey } = getProviderConfig(body);
    const { model, prompt, payload } = createImageEditRequestPayload(body);

    const edited = await requestEditedImage({
      apiKey,
      model,
      prompt,
      payload,
    });

    if (!edited.ok) {
      return response.status(202).json({
        job: createFailedJob({
          prompt,
          model,
          error: edited.failure,
        }),
      });
    }

    return response.status(202).json({
      job: createCompletedJob({
        prompt,
        model,
        result: edited.result,
      }),
    });

  } catch (error: any) {
    console.error('【Vercel Image Edit 接口崩溃日志】:', error);

    const status = error instanceof SyntaxError ? 400
                 : error.message === 'missing_prompt' ? 400
                 : error.message === 'missing_image' ? 400
                 : 500;

    return response.status(status).json({
      error: 'Image edit failed.',
      details: error.message || 'Unknown error occurred'
    });
  }
}
