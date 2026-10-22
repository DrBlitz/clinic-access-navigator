const PROTOCOL_VERSION = '2025-11-25';

/** @param {(entry: {method: string, status: number, result: unknown}) => void} onTrace */
export async function callClinicTool(tool, fetcher = fetch, onTrace = () => {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  const headers = { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': PROTOCOL_VERSION };
  async function rpc(method, params, id) {
    const response = await fetcher('/api/mcp', { method: 'POST', headers, signal: controller.signal, body: JSON.stringify({ jsonrpc: '2.0', ...(id === undefined ? {} : { id }), method, params }) });
    if (!response.ok) throw new Error(`Service unavailable (HTTP ${response.status})`);
    if (id === undefined) {
      if (response.status !== 202) throw new Error('Notification was not accepted');
      onTrace({ method, status: response.status, result: 'Accepted' });
      return;
    }
    const payload = await readRpcResponse(response, id);
    if (payload.error || payload.id !== id || !payload.result || payload.result.isError) throw new Error(payload.error?.message || 'Tool request failed');
    onTrace({ method, status: response.status, result: payload.result });
    return payload.result;
  }
  try {
    const initialized = await rpc('initialize', { protocolVersion: PROTOCOL_VERSION, capabilities: {}, clientInfo: { name: 'clinic-demo', version: '0.2.0' } }, 1);
    if (initialized.protocolVersion !== PROTOCOL_VERSION) throw new Error('Unsupported server version');
    await rpc('notifications/initialized', {}, undefined);
    const listed = await rpc('tools/list', {}, 2);
    if (!Array.isArray(listed.tools) || !listed.tools.some(t => t.name === tool.name)) throw new Error('Tool not advertised by server');
    const result = await rpc('tools/call', tool, 3);
    if (!result.structuredContent || typeof result.structuredContent !== 'object') throw new Error('Missing tool output');
    return result.structuredContent;
  } finally { clearTimeout(timer); }
}

// Streamable HTTP clients must understand both JSON and SSE responses.
export async function readRpcResponse(response, id) {
  const mime = (response.headers.get('content-type') ?? '').split(';')[0].trim();
  if (mime === 'application/json') return response.json();
  if (mime !== 'text/event-stream' || !response.body) throw new Error('Unsupported response type');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let total = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) throw new Error('SSE ended before RPC response');
      total += value.byteLength;
      if (total > 262144) throw new Error('Response too large');
      buffer += decoder.decode(value, { stream: true });
      let boundary;
      while ((boundary = /\r?\n\r?\n/.exec(buffer))) {
        const block = buffer.slice(0, boundary.index);
        buffer = buffer.slice(boundary.index + boundary[0].length);
        const data = block.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).replace(/^ /, '')).join('\n');
        if (!data) continue;
        const message = JSON.parse(data);
        if (message.id === id) return message;
      }
    }
  } finally { await reader.cancel(); }
}
