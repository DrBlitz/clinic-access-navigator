import { handleMcp } from '../lib/clinic-mcp.mjs';

export async function handler(event) {
  const method = event.requestContext?.http?.method ?? 'POST';
  const body = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64') : event.body;
  const request = new Request('https://lambda.internal/mcp', {
    method, headers: event.headers ?? {},
    ...(['GET', 'HEAD'].includes(method) ? {} : { body }),
  });
  const origins = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const response = await handleMcp(request, origins);
  return { statusCode: response.status, headers: Object.fromEntries(response.headers), body: await response.text(), isBase64Encoded: false };
}
