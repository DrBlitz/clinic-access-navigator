import assert from 'node:assert/strict';
import { callClinicTool } from '../lib/clinic-client.mjs';
const endpoint = process.argv[2];
if (!endpoint || !/^https?:\/\//.test(endpoint)) throw new Error('Usage: node scripts/smoke.mjs https://host/api/mcp');
const cases = [
  {name:'get_branch_information', arguments:{branch:'ayala'}},
  {name:'check_appointment_availability', arguments:{branch:'mactan',service:'Diagnostic hearing evaluation',date:'2026-10-23'}},
  {name:'get_visit_preparation', arguments:{service:'Diagnostic hearing evaluation'}},
  {name:'find_clinic_service', arguments:{concern:'Book Friday for sudden hearing loss'}},
];
for (const tool of cases) {
  const events=[];
  const result=await callClinicTool(tool, (_, options)=>fetch(endpoint, options), e=>events.push(e.method));
  assert.equal(result.synthetic,true);
  assert.equal(events.length,4);
  if (tool.name==='find_clinic_service') assert.equal(result.urgency,'urgent');
  console.log('PASS',tool.name,'initialize → initialized → tools/list → tools/call');
}
console.log('PASS',endpoint,'All four tools returned real server responses. This does not certify full MCP conformance or clinical safety.');
