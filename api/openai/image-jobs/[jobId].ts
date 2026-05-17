import {
  sendNodeJson,
  sendNodeOptions,
} from '../../_openaiRelay';

export default async function handler(request: any, response: any) {
  if (request.method === 'OPTIONS') {
    sendNodeOptions(response);
    return;
  }

  if (request.method !== 'GET') {
    sendNodeJson(response, { error: 'method_not_allowed' }, 405);
    return;
  }

  sendNodeJson(response, {
    error: 'image_job_not_found',
    message: 'This Vercel deployment returns image task results from the create request. Create a new image task if this page was refreshed.',
  }, 404);
}
