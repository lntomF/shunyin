import {
  createCompletedJob,
  createFailedJob,
  createImageRequestPayload,
  getProviderConfig,
  requestGeneratedImage,
} from '../_openaiRelay';

// ⚠️ 极其重要：保留 Vercel Serverless 超时配置，防止生图慢导致 504
export const maxDuration = 60;

export default async function handler(request: any, response: any) {
  // 1. 标准 OPTIONS 预检请求响应
  if (request.method === 'OPTIONS') {
    return response.status(200).end();
  }

  // 2. 限制为 POST 请求
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'method_not_allowed' });
  }

  try {
    // 3. ✅ 关键修改：直接读取 Vercel 解析好的 JSON body，抛弃 readNodeJsonBody
    const body = typeof request.body === 'string' 
      ? JSON.parse(request.body) 
      : (request.body || {});

    const { apiKey } = getProviderConfig(body);
    const { model, prompt, payload } = createImageRequestPayload(body);
    
    const generated = await requestGeneratedImage({
      apiKey,
      model,
      prompt,
      payload,
    });

    // 4. ✅ 关键修改：直接使用 response.status().json()，抛弃 sendNodeJson
    if (!generated.ok) {
      return response.status(202).json({
        job: createFailedJob({
          prompt,
          model,
          error: generated.failure,
        }),
      });
    }

    // 5. ✅ 返回成功结果
    return response.status(202).json({
      job: createCompletedJob({
        prompt,
        model,
        result: generated.result,
      }),
    });

  } catch (error: any) {
    // 6. ✅ 彻底防崩溃的 Error 兜底机制
    console.error('【Vercel Image 接口崩溃日志】:', error);
    
    const status = error instanceof SyntaxError ? 400 
                 : error.message === 'missing_prompt' ? 400 
                 : 500;
                 
    return response.status(status).json({ 
      error: 'Image generation failed.',
      details: error.message || 'Unknown error occurred'
    });
  }
}