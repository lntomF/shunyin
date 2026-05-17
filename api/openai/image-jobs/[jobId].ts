import {
  jsonResponse,
  optionsResponse,
} from '../../_openaiRelay';

async function handleRequest(request: Request) {
  if (request.method === 'OPTIONS') return optionsResponse();

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  return jsonResponse({
    error: 'image_job_not_found',
    message: 'This Vercel deployment returns image task results from the create request. Create a new image task if this page was refreshed.',
  }, 404);
}

export default {
  fetch: handleRequest,
};
