// A deliberately limited English demonstration router, not a triage engine.
export function needsUrgentGuidance(text) {
  return /sudden(?:ly)?[\s\S]{0,65}(?:hear|deaf)|(?:hear|deaf)[\s\S]{0,65}sudden|facial weakness|face.{0,12}droop|severe dizziness|stroke|chest pain|cannot breathe|can't breathe/i.test(text);
}

export function nextFriday(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const field = type => parts.find(p => p.type === type).value;
  const date = new Date(`${field('year')}-${field('month')}-${field('day')}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + ((5 - date.getUTCDay() + 7) % 7));
  return date.toISOString().slice(0, 10);
}

export function selectTool(input) {
  const query = input.toLowerCase();
  const branch = /mactan|lapu/.test(query) ? 'mactan' : /ucmed|mandaue/.test(query) ? 'ucmed' : 'ayala';
  if (needsUrgentGuidance(query)) return { name: 'find_clinic_service', arguments: { concern: input } };
  if (/bring|prepar/.test(query)) return { name: 'get_visit_preparation', arguments: { service: 'Diagnostic hearing evaluation' } };
  if (/friday|schedule|appointment|availability/.test(query)) return { name: 'check_appointment_availability', arguments: { branch, service: 'Diagnostic hearing evaluation', date: nextFriday() } };
  if (/branch|location|ayala|mactan|ucmed|mandaue/.test(query)) return { name: 'get_branch_information', arguments: { branch } };
  return { name: 'find_clinic_service', arguments: { concern: input } };
}
