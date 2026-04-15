export default async function onRequest(context) {
  const AK = context.env.AK || '';

  const body = await context.request.json();

  const res = await fetch('https://image.edgeone.app/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'OE-USER-ID': '341ec31b3b9f4602b95b5117823d2f43',
      'OE-API-KEY': AK,
      'OE-TEMPLATE-ID': 'ep-tB9p4ZAP5hKL'
    },
    body: JSON.stringify(body)
  });

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
}
