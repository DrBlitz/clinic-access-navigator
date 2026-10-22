import { bookingTools, runBookingTool } from './booking.mjs';
import { needsUrgentGuidance } from './clinic-routing.mjs';

export const PROTOCOL_VERSION = '2025-11-25';
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const branch = { type: 'string', enum: ['ayala', 'mactan', 'ucmed'] };
const service = { type: 'string', enum: ['Diagnostic hearing evaluation', 'ENT consultation'] };
const definition = (name, description, properties) => ({
  name, description, annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  inputSchema: { type: 'object', properties, required: Object.keys(properties), additionalProperties: false },
});
export const tools = [
  ...bookingTools,
  definition('find_clinic_service', 'Limited English service-navigation demo. Does not diagnose or assess urgency comprehensively.', { concern: { type: 'string', minLength: 3, maxLength: 1000 } }),
  definition('get_branch_information', 'Return demo branch labels. Actual hours and access must be verified with the clinic.', { branch }),
  definition('check_appointment_availability', 'Return synthetic slots only; never makes a real booking.', { branch, service, date: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' } }),
  definition('get_visit_preparation', 'Return general demo visit preparation; clinic must confirm specific instructions.', { service }),
];
const branches = { ayala: 'Ayala Center Cebu', mactan: 'City Time Square Mactan', ucmed: 'UCMED Mandaue' };

export function runTool(name, args, store) {
  const tool = tools.find(t => t.name === name);
  if (!tool) throw new Error('Unknown tool');
  if (!object(args)) throw new Error('Arguments must be an object');
  const properties = tool.inputSchema.properties;
  if (Object.keys(args).some(key => !Object.hasOwn(properties, key))) throw new Error('Unexpected argument');
  for (const [key, schema] of Object.entries(properties)) {
    const value = args[key];
    if (typeof value !== 'string' || !value.trim() || value.length > (schema.maxLength ?? 120)) throw new Error(`Invalid ${key}`);
    if (schema.minLength && value.trim().length < schema.minLength) throw new Error(`Invalid ${key}`);
    if (schema.enum && !schema.enum.includes(value)) throw new Error(`Invalid ${key}`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) throw new Error(`Invalid ${key}`);
  }
  if (args.date && (Number.isNaN(Date.parse(`${args.date}T00:00:00Z`)) || new Date(`${args.date}T00:00:00Z`).toISOString().slice(0,10) !== args.date)) throw new Error('Invalid calendar date');
  if (bookingTools.some(t => t.name === name)) return runBookingTool(name, args, store);
  if (name === 'find_clinic_service') {
    if (needsUrgentGuidance(args.concern)) return { synthetic: true, urgency: 'urgent', guidance: 'Seek urgent in-person medical assessment. Do not wait for a routine booking response. If symptoms could be life-threatening, contact local emergency services.' };
    if (/ringing|tinnitus|hearing|ear|deaf/i.test(args.concern)) return { synthetic: true, urgency: 'not_assessed', recommended_services: ['ENT consultation'], guidance: 'An ENT consultation is an available service for ear or hearing concerns. A clinician can determine whether hearing tests are needed. This demo cannot assess urgency or rule out an emergency.' };
    return { synthetic: true, urgency: 'not_assessed', recommended_services: [], guidance: 'I could not match that request to this demo’s ear and hearing services. Please ask about branch information, hearing-test availability, or visit preparation. For symptoms, contact a clinician; this demo cannot determine urgency.' };
  }
  if (name === 'get_branch_information') return { synthetic: true, name: branches[args.branch], hours: args.branch === 'ayala' ? 'Sunday–Thursday 10 AM–9 PM; Friday–Saturday 10 AM–10 PM (Philippine time; provided by clinic owner). Doctor schedules are separate.' : 'Please confirm directly with the clinic.', accessibility: 'Accessibility details have not been verified.' };
  if (name === 'check_appointment_availability') return { synthetic: true, branch: args.branch, branch_name: branches[args.branch], service: args.service, date: args.date, timezone: 'Asia/Manila', available_times: new Date(`${args.date}T00:00:00Z`).getUTCDay() === 0 ? [] : ['10:00', '13:30', '15:45'], booking_supported: false };
  return { synthetic: true, service: args.service, instructions: ['General demo guidance: bring a valid ID and prior hearing-test results if available.', 'Bring your current hearing aids or ear devices.', 'Confirm arrival time and any service-specific instructions with the clinic.'] };
}

const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
const fail = (id, code, message, status = 200) => json({ jsonrpc: '2.0', id, error: { code, message } }, status);

// Stateless JSON response mode of Streamable HTTP; no SSE or sessions advertised.
export async function handleMcp(request, allowedOrigins, store) {
  const origin = request.headers.get('origin');
  if (origin !== null && !allowedOrigins.includes(origin)) return json({ error: 'Origin not allowed' }, 403);
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { Allow: 'POST', 'Cache-Control': 'no-store' } });
  if ((request.headers.get('content-type') ?? '').split(';')[0].trim() !== 'application/json') return json({ error: 'Expected application/json' }, 415);
  const accepted = (request.headers.get('accept') ?? '').split(',').map(x => x.split(';')[0].trim());
  if (!accepted.includes('application/json') || !accepted.includes('text/event-stream')) return json({ error: 'Accept must include application/json and text/event-stream' }, 406);
  const version = request.headers.get('mcp-protocol-version');
  if (version && version !== PROTOCOL_VERSION) return fail(null, -32600, 'Unsupported protocol version', 400);
  let body;
  try {
    const reader = request.body?.getReader();
    let size = 0;
    const chunks = [];
    if (!reader) return fail(null, -32700, 'Parse error', 400);
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 16384) { await reader.cancel(); return json({ error: 'Request too large' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch { return fail(null, -32700, 'Parse error', 400); }
  if (!object(body) || body.jsonrpc !== '2.0' || typeof body.method !== 'string' || (body.params !== undefined && !object(body.params))) return fail(null, -32600, 'Invalid Request', 400);
  const hasId = Object.hasOwn(body, 'id');
  if (hasId && !(typeof body.id === 'string' || (typeof body.id === 'number' && Number.isFinite(body.id)))) return fail(null, -32600, 'Invalid id', 400);
  if (!hasId) {
    if (!body.method.startsWith('notifications/')) return fail(null, -32600, 'Request id required', 400);
    return new Response(null, { status: 202 });
  }
  const ok = result => json({ jsonrpc: '2.0', id: body.id, result });
  if (body.method === 'initialize') {
    const p = body.params;
    if (!p || typeof p.protocolVersion !== 'string' || !object(p.capabilities) || !object(p.clientInfo) || typeof p.clientInfo.name !== 'string' || typeof p.clientInfo.version !== 'string') return fail(body.id, -32602, 'Invalid initialize parameters');
    return ok({ protocolVersion: PROTOCOL_VERSION, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'clinic-access-navigator', version: '0.4.0' }, instructions: 'Synthetic demo bookings use fictional adult presets. No diagnoses, real bookings, notifications, or real patient records. Rule-based navigation is not clinical triage.' });
  }
  if (!version) return fail(body.id, -32600, 'MCP-Protocol-Version header required for this server', 400);
  if (body.method === 'ping') return ok({});
  if (body.method === 'tools/list') {
    if (body.params?.cursor) return fail(body.id, -32602, 'Invalid cursor');
    return ok({ tools });
  }
  if (body.method === 'tools/call') {
    try {
      const output = await runTool(body.params?.name, body.params?.arguments, store);
      return ok({ content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output, isError: false });
    } catch (error) { return fail(body.id, -32602, error.message); }
  }
  return fail(body.id, -32601, 'Method not found');
}
