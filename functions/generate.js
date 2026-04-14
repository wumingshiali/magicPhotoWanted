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

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}
