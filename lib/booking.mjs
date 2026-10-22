export const DOCTORS = [
  { id: 'a', name: 'ENT Doctor A', days: [1,2,3,4,5], start: 11, end: 15, schedule: 'Monday–Friday · 11 AM–3 PM' },
  { id: 'b', name: 'ENT Doctor B', days: [2,3,4,5,6], start: 16, end: 19, schedule: 'Tuesday–Saturday · 4 PM–7 PM' },
];
export const PATIENTS = [
  { id:'p1', name:'Miguel Santos', birth_date:'1991-04-18', sex:'Male', city:'Cebu City', email:'miguel.santos@example.com' },
  { id:'p2', name:'Isabel Reyes', birth_date:'1988-09-12', sex:'Female', city:'Mandaue City', email:'isabel.reyes@example.com' },
  { id:'p3', name:'Paolo Dela Cruz', birth_date:'1996-02-07', sex:'Male', city:'Lapu-Lapu City', email:'paolo.delacruz@example.com' },
  { id:'p4', name:'Camille Garcia', birth_date:'1983-11-23', sex:'Female', city:'Talisay City', email:'camille.garcia@example.com' },
];
export const manilaDate = (now=new Date()) => new Date(now.getTime()+8*3600000).toISOString().slice(0,10);
const uuid = {type:'string',pattern:'^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'};
const doctor = {type:'string',enum:['a','b']};
const date = {type:'string',pattern:'^\\d{4}-\\d{2}-\\d{2}$'};
function tool(name,description,properties,write=false){return {name,description,annotations:{readOnlyHint:!write,destructiveHint:false,idempotentHint:true,openWorldHint:false},inputSchema:{type:'object',properties,required:Object.keys(properties),additionalProperties:false}}}
export const bookingTools = [
 tool('get_demo_booking_options','Get fictional doctors and adult patient presets, Ayala opening hours and demo booking window.',{}),
 tool('list_demo_slots','List currently available 30-minute fictional ENT appointments at Ayala. All times Asia/Manila.',{doctor,date}),
 tool('book_demo_appointment','Reserve a fictional appointment only after explicit user confirmation. No real appointment or notification. booking_id is the idempotency key.',{session_id:uuid,booking_id:uuid,doctor,date,time:{type:'string',pattern:'^\\d{2}:\\d{2}$'},patient_id:{type:'string',enum:PATIENTS.map(p=>p.id)},confirmation:{type:'string',enum:['confirm_demo_booking']}},true),
 tool('list_demo_appointments','List bookings belonging to this private demo browser token.',{session_id:uuid}),
 tool('cancel_demo_appointment','Cancel your demo reservation and release its slot after explicit confirmation.',{session_id:uuid,booking_id:uuid,confirmation:{type:'string',enum:['confirm_demo_cancellation']}},true),
];
export function scheduleSlots(doctorId,date,now=new Date()){
 const d=DOCTORS.find(d=>d.id===doctorId);if(!d)throw Error('Unknown demo doctor');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||Number.isNaN(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('Invalid date');
 const day=manilaDate(now),max=new Date(Date.parse(day+'T00:00:00Z')+30*86400000).toISOString().slice(0,10);
 if(date<day||date>max)throw Error('Choose a date from today through the next 30 days');
 if(!d.days.includes(new Date(date+'T00:00:00Z').getUTCDay()))return [];
 const slots=[];for(let h=d.start;h<d.end;h++)for(const m of ['00','30']){const t=String(h).padStart(2,'0')+':'+m;if(Date.parse(date+'T'+t+':00+08:00')>now.getTime())slots.push(t)}return slots;
}
export function createBookingStore(db){
 const all=async(sql,...values)=>(await db.prepare(sql).bind(...values).all()).results;
 const run=async(sql,...values)=>db.prepare(sql).bind(...values).run();
 return {
  all,run,
  async reserve(a){
   await run("INSERT INTO demo_bookings (id,session_id,doctor,date,time,patient_id,status,created_at) VALUES (?,?,?,?,?,?,'confirmed',?) ON CONFLICT DO NOTHING",a.booking_id,a.session_id,a.doctor,a.date,a.time,a.patient_id,new Date().toISOString());
   const rows=await all('SELECT * FROM demo_bookings WHERE id=? AND session_id=?',a.booking_id,a.session_id);
   const row=rows[0];
   if(!row)throw Error('That demo slot was just booked. Refresh availability and choose another.');
   if(row.doctor!==a.doctor||row.date!==a.date||row.time!==a.time||row.patient_id!==a.patient_id)throw Error('Booking request identifier was already used');
   if(row.status!=='confirmed')throw Error('This booking was cancelled. Start a new booking.');
   return row;
  },
 };
}
function display(row){return {id:row.id,reference:'DEMO-'+row.id.toUpperCase(),doctor:DOCTORS.find(d=>d.id===row.doctor)?.name,date:row.date,time:row.time,patient:PATIENTS.find(p=>p.id===row.patient_id),status:row.status,branch:'Ayala Center Cebu',timezone:'Asia/Manila',duration_minutes:30,synthetic:true}}
export async function runBookingTool(name,a,store,now=new Date()){
 const today=manilaDate(now);
 if(name==='get_demo_booking_options')return {synthetic:true,doctors:DOCTORS,patients:PATIENTS,today,max_date:new Date(Date.parse(today+'T00:00:00Z')+30*86400000).toISOString().slice(0,10),timezone:'Asia/Manila',branch:'Ayala Center Cebu',branch_hours:'Sunday–Thursday 10 AM–9 PM; Friday–Saturday 10 AM–10 PM (provided by clinic owner)',duration_minutes:30};
 if(!store)throw Error('Demo booking storage is not configured on this deployment');
 if(name==='list_demo_slots'){
  const scheduled=scheduleSlots(a.doctor,a.date,now);const taken=await store.all("SELECT time FROM demo_bookings WHERE doctor=? AND date=? AND status='confirmed'",a.doctor,a.date);
  return {synthetic:true,doctor:DOCTORS.find(d=>d.id===a.doctor).name,date:a.date,timezone:'Asia/Manila',available_times:scheduled.filter(t=>!taken.some(r=>r.time===t)),duration_minutes:30};
 }
 if(name==='book_demo_appointment'){
  if(a.confirmation!=='confirm_demo_booking'||!PATIENTS.some(p=>p.id===a.patient_id))throw Error('Explicit confirmation and a fictional patient preset are required');
  const existing=await store.all('SELECT * FROM demo_bookings WHERE id=? AND session_id=?',a.booking_id,a.session_id);
  if(!existing.length&&!scheduleSlots(a.doctor,a.date,now).includes(a.time))throw Error('That time is outside the doctor schedule or is in the past');
  return {synthetic:true,booking:display(await store.reserve(a)),message:'Demo booking confirmed. No real appointment, email or SMS was created.'};
 }
 if(name==='list_demo_appointments')return {synthetic:true,bookings:(await store.all('SELECT * FROM demo_bookings WHERE session_id=? ORDER BY date DESC,time DESC LIMIT 100',a.session_id)).map(display)};
 if(name==='cancel_demo_appointment'){
  if(a.confirmation!=='confirm_demo_cancellation')throw Error('Explicit cancellation confirmation required');
  const rows=await store.all('SELECT * FROM demo_bookings WHERE id=? AND session_id=?',a.booking_id,a.session_id);
  if(!rows.length)throw Error('Demo booking not found in this browser session');
  await store.run("UPDATE demo_bookings SET status='cancelled' WHERE id=? AND session_id=?",a.booking_id,a.session_id);
  return {synthetic:true,booking:display({...rows[0],status:'cancelled'}),message:'Demo booking cancelled. The slot is available again.'};
 }
 throw Error('Unknown booking tool');
}
