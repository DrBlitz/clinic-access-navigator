import test from 'node:test';
import assert from 'node:assert/strict';
import { handleMcp, runTool, PROTOCOL_VERSION } from '../lib/clinic-mcp.mjs';
import { selectTool, nextFriday } from '../lib/clinic-routing.mjs';
import { callClinicTool, readRpcResponse } from '../lib/clinic-client.mjs';
import { handler } from '../aws/handler.mjs';
const headers = { 'content-type': 'application/json', accept: 'application/json, text/event-stream', 'mcp-protocol-version': PROTOCOL_VERSION };
const origin = 'https://clinic-access-navigator.janrusabello.chatgpt.site';
const request = (body, extra = {}) => new Request('https://example.com/api/mcp', { method: 'POST', headers, body: JSON.stringify(body), ...extra });
const call = args => ({ jsonrpc: '2.0', id: 2, method: 'tools/call', params: args });
test('client initializes, notifies, and calls real core', async () => {
  const methods = [];
  const output = await callClinicTool(selectTool('ringing in my ears'), async (url, options) => {
    methods.push(JSON.parse(options.body).method);
    return handleMcp(new Request('https://example.com'+url, options), [origin]);
  });
  assert.deepEqual(methods, ['initialize', 'notifications/initialized', 'tools/list', 'tools/call']);
  assert.equal(output.urgency, 'not_assessed');
});
test('urgent phrasing wins over scheduling and branch routing', () => {
  for (const concern of ['I suddenly lost hearing', 'Book Ayala Friday for sudden hearing loss', 'appointment for facial weakness']) {
    const selected = selectTool(concern);
    assert.equal(selected.name, 'find_clinic_service');
    assert.equal(runTool(selected.name, selected.arguments).urgency, 'urgent');
  }
});
test('unrecognized concern is never called routine or assigned hearing tests', () => {
  const result = runTool('find_clinic_service', { concern: 'My knee hurts' });
  assert.equal(result.urgency, 'not_assessed');
  assert.deepEqual(result.recommended_services, []);
});
test('schemas reject missing, extra, null, unknown and invalid dates', () => {
  for (const args of [null, [], {}, { concern: 9 }, { concern: 'hi' }, { concern: 'hello', extra: 1 }]) assert.throws(() => runTool('find_clinic_service', args));
  assert.throws(() => runTool('get_branch_information', { branch: 'unknown' }));
  assert.throws(() => runTool('check_appointment_availability', { branch: 'ayala', service: 'ENT consultation', date: '2026-02-30' }));
});
test('origin checks are exact and apply to every method', async () => {
  for (const method of ['POST', 'GET', 'DELETE']) {
    for (const bad of ['https://evil.chatgpt.site', 'https://localhost.evil.com', origin+'.evil.com', 'null']) {
      const result = await handleMcp(new Request('https://example.com', { method, headers: { origin: bad } }), [origin]);
      assert.equal(result.status, 403);
    }
  }
  assert.equal((await handleMcp(request(call(selectTool('Ayala branch')), { headers: { ...headers, origin } }), [origin])).status, 200);
});
test('unsupported transport methods and headers fail clearly', async () => {
  assert.equal((await handleMcp(new Request('https://example.com'), [])).status, 405);
  assert.equal((await handleMcp(request({}, { headers: {} }), [])).status, 415);
  assert.equal((await handleMcp(request({}, { headers: { ...headers, accept: 'application/json' } }), [])).status, 406);
  assert.equal((await handleMcp(request({}, { headers: { ...headers, 'mcp-protocol-version': 'bad' } }), [])).status, 400);
});
test('malformed envelopes and oversized bodies are rejected', async () => {
  for (const body of [null, [], 5, { jsonrpc: '2.0', id: null, method: 'ping' }, { jsonrpc: '2.0', id: 1, method: 'ping', params: [] }]) assert.equal((await handleMcp(request(body), [])).status, 400);
  assert.equal((await handleMcp(request('x'.repeat(17000)), [])).status, 413);
  const malformed = await handleMcp(request(null, { body: '{' }), []);
  assert.equal((await malformed.json()).error.code, -32700);
});
test('tool error is JSON-RPC error and successful tools are structured', async () => {
  const invalid = await handleMcp(request(call({ name: 'find_clinic_service', arguments: null })), []);
  assert.equal((await invalid.json()).error.code, -32602);
  const result = await handleMcp(request({ jsonrpc: '2.0', id: 1, method: 'tools/list' }), []);
  assert.equal((await result.json()).result.tools.length, 4);
});
test('sample Sunday empty, branch selection and Manila Friday correct', () => {
  assert.equal(selectTool('Mactan appointment').arguments.branch, 'mactan');
  assert.equal(nextFriday(new Date('2026-09-17T18:00:00Z')), '2026-09-18');
  assert.deepEqual(runTool('check_appointment_availability', { branch: 'ayala', service: 'ENT consultation', date: '2026-09-20' }).available_times, []);
});
test('Lambda adapter supports base64 API Gateway body', async () => {
  const result = await handler({ requestContext: { http: { method: 'POST' } }, headers, isBase64Encoded: true, body: Buffer.from(JSON.stringify(call(selectTool('what should I bring')))).toString('base64') });
  assert.equal(result.statusCode, 200);
  assert.equal(JSON.parse(result.body).result.structuredContent.synthetic, true);
});


test('client accepts split SSE frames and ignores unrelated notifications', async () => {
  const chunks = [': keepalive\n\ndata: {"jsonrpc":"2.0","method":"notifications/progress"}\n\n', 'data: {"jsonrpc":"2.0","id":7,"result":{"ok":true}}\r', '\n\r\n'];
  const body = new ReadableStream({start(controller) { for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk)); controller.close(); }});
  const result = await readRpcResponse(new Response(body, {headers:{'content-type':'text/event-stream'}}), 7);
  assert.equal(result.result.ok, true);
});

test('client surfaces a failed server and never fabricates a tool result', async () => {
  await assert.rejects(callClinicTool(selectTool('Ayala branch'), async () => new Response('unavailable', {status:503})), /503/);
  await assert.rejects(readRpcResponse(new Response('<html>login</html>', {headers:{'content-type':'text/html'}}), 1), /Unsupported/);
});

test('standalone server serves UI and real MCP over HTTP', async () => {
  const { createDemoServer } = await import('../scripts/local-server.mjs');
  const server = createDemoServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    assert.match(await (await fetch(base)).text(), /Live MCP exchange/);
    const result = await callClinicTool(selectTool('Ayala branch'), (url, opts) => fetch(base + url, opts));
    assert.equal(result.name, 'Ayala Center Cebu');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
