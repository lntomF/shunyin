export default async function handler(request: any, response: any) {
  // 1. 标准 OPTIONS 预检请求响应
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // 2. 限制为 GET 请求
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'method_not_allowed' });
  }

  // 3. ✅ 关键修改：直接使用原生 res.status().json() 返回 404
  return response.status(404).json({
    error: 'image_job_not_found',
    message: 'This Vercel deployment returns image task results from the create request. Create a new image task if this page was refreshed.',
  });
}