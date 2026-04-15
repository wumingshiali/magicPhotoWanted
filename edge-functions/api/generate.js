export default async function onRequest(context) {
  try {
    const AK = context.env.AK || '';
    
    if (!AK) {
      return new Response(JSON.stringify({
        error: 'API Key 未配置，请检查环境变量 AK'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await context.request.json();

    console.log('收到请求，模板数据:', JSON.stringify(body));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 秒超时

    console.log('开始调用上游 API, AK:', AK.substring(0, 10) + '...');

    const res = await fetch('https://image.edgeone.app/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OE-USER-ID': '341ec31b3b9f4602b95b5117823d2f43',
        'OE-API-KEY': AK,
        'OE-TEMPLATE-ID': 'ep-tB9p4ZAP5hKL'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log('上游 API 响应状态:', res.status);

    const contentType = res.headers.get('content-type') || '';

    // 如果是图片，直接返回
    if (contentType.includes('image')) {
      const buffer = await res.arrayBuffer();
      return new Response(buffer, {
        status: res.status,
        headers: { 'Content-Type': contentType }
      });
    }

    // 如果是 JSON，解析后返回
    if (contentType.includes('application/json')) {
      const data = await res.json();
      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 其他情况，返回文本
    const text = await res.text();

    // 尝试检测是否为 JSON（有些响应可能没有正确的 content-type）
    try {
      const trimmed = text.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
          (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        JSON.parse(trimmed); // 验证是否为有效 JSON
        return new Response(trimmed, {
          status: res.status,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch {
      // 不是有效 JSON，继续处理
    }

    return new Response(JSON.stringify({ error: text.substring(0, 500), status: res.status }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // 捕获所有异常，返回格式化的错误信息
    let errorMessage = error.message || 'Internal server error';
    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout: 上游 API 响应超时，请稍后重试';
    } else if (errorMessage.includes('net_exception_timeout')) {
      errorMessage = 'Request timeout: 上游 API 响应超时，请稍后重试';
    }
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      status: 504,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
