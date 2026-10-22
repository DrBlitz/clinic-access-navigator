import {needsUrgentGuidance,selectTool} from './clinic-routing.mjs';
export function newId(){const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=Array.from(b,x=>x.toString(16).padStart(2,'0')).join('');return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`}
export function demoSession(){let id=localStorage.getItem('clinic-demo-session-v1');if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id||'')){id=newId();localStorage.setItem('clinic-demo-session-v1',id)}return id}
export const clock=t=>{const [h,m]=t.split(':').map(Number);return `${h%12||12}:${String(m).padStart(2,'0')} ${h<12?'AM':'PM'}`};
export function dateFrom(text,today){
 const iso=text.match(/\b\d{4}-\d{2}-\d{2}\b/);if(iso)return iso[0];
 const base=new Date(today+'T00:00:00Z');let days;
 if(/\btomorrow\b/i.test(text))days=1;else if(/\btoday\b/i.test(text))days=0;
 else {const names=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];const index=names.findIndex(n=>new RegExp('\\b'+n+'\\b','i').test(text));if(index>=0){days=(index-base.getUTCDay()+7)%7;if(/\bnext\b/i.test(text)&&days===0)days=7}}
 if(days===undefined)return null;base.setUTCDate(base.getUTCDate()+days);return base.toISOString().slice(0,10);
}
export class ClinicConversation{
 constructor(call,session,id=newId){this.call=call;this.session=session;this.id=id;this.draft={};this.stage='idle';this.choices=['Book an ENT consultation Friday afternoon','My appointments','Ayala branch information'];this.pending=null}
 reply(text,choices=[]){this.choices=choices;return {text,choices}}
 async options(){this.o=await this.call('get_demo_booking_options',{});return this.o}
 async send(raw){const text=raw.trim(),q=text.toLowerCase();
 if(needsUrgentGuidance(text)){this.pending=null;this.stage='idle';this.draft={};const r=await this.call('find_clinic_service',{concern:text});return this.reply(r.guidance)}
 if(/^(start over|restart|never mind|stop|no|back)$/i.test(text)){this.pending=null;this.draft={};this.stage='idle';return this.reply('The unfinished request is cleared. Existing reservations are unchanged.',['Book an appointment','My appointments'])}
 if(/^confirm (demo )?booking$/i.test(text)){
  if(this.stage!=='confirm'||!this.pending)return this.reply('Please select and review an appointment first.',['Book an appointment','My appointments']);
  const r=await this.call('book_demo_appointment',this.pending);this.pending=null;this.stage='idle';this.draft={};return this.reply(`Demo booking confirmed.\n${this.describe(r.booking)}\n${r.booking.reference}\nSaved to the demo database. No real appointment or notification was created.`,['My appointments','Book another appointment']);
 }
 if(/^confirm (demo )?cancellation$/i.test(text)){
  if(this.stage!=='cancel-confirm'||!this.pending)return this.reply('Choose a reservation to cancel first.',['My appointments']);
  const r=await this.call('cancel_demo_appointment',this.pending);this.pending=null;this.stage='idle';return this.reply(`Demo reservation cancelled. ${this.describe(r.booking)}\nThe slot is available again.`,['My appointments','Book an appointment']);
 }
 if(/\b(my|show|view|list)\b.*\b(appointments|bookings|reservations)\b/i.test(text)||/^(cancel|cancel appointment|cancel booking)$/i.test(text))return this.list();
 if(/^cancel DEMO-/i.test(text)){
  const r=await this.call('list_demo_appointments',{session_id:this.session});const b=r.bookings.find(b=>b.reference.toLowerCase()===text.slice(7).trim().toLowerCase()&&b.status==='confirmed');
  if(!b)return this.reply('That active reservation was not found in this browser.',['My appointments']);
  this.stage='cancel-confirm';this.pending={session_id:this.session,booking_id:b.id,confirmation:'confirm_demo_cancellation'};return this.reply(`Cancel this fictional reservation?\n${this.describe(b)}\n${b.reference}\nNothing changes until you confirm.`,['Confirm demo cancellation','Never mind']);
 }
 if(/\b(reschedule|move my|change my appointment)\b/.test(q))return this.reply('To change an appointment, book the replacement first, then cancel the old reservation. This avoids losing your current slot if the replacement is unavailable.',['Book another appointment','My appointments']);
 if(/\b(bring|prepar|branch|location|hours)\b/.test(q)){
  const tool=/bring|prepar/i.test(text)?selectTool(text):{name:'get_branch_information',arguments:{branch:/mactan/i.test(text)?'mactan':/ucmed|mandaue/i.test(text)?'ucmed':'ayala'}};const r=await this.call(tool.name,tool.arguments);return this.reply(r.instructions?.join(' ')||`${r.name} — ${r.hours} ${r.accessibility}`,this.choices);
 }
 if(/\b(mactan|ucmed|mandaue)\b/.test(q)&&/book|appointment|slot/.test(q))return this.reply('Fictional ENT bookings are available only at Ayala Center Cebu.',['Book at Ayala','My appointments']);
 const begin=/\b(book|appointment|consultation|availability|available|slots)\b/.test(q);
 if(begin&&this.stage==='idle'){this.draft={};this.pending=null;this.stage='collect'}
 if(this.stage==='idle')return this.reply('I can guide a fictional ENT booking, show your reservations, or cancel one. I use guided English rules and may need a date or choice stated explicitly.',['Book an appointment','My appointments','Ayala branch information']);
 if(this.stage==='cancel-confirm')return this.reply('Please explicitly confirm cancellation or keep the reservation.',['Confirm demo cancellation','Never mind']);
 await this.options();
 const doctor=text.match(/(?:ent\s+)?doctor\s*([ab])\b/i)||text.match(/^([ab])$/i);
 const date=dateFrom(text,this.o.today);
 if(doctor||date||/\b(morning|afternoon|evening)\b/i.test(text)){
  this.pending=null;this.stage='collect';delete this.draft.time;
  if(doctor)this.draft.doctor=doctor[1].toLowerCase();if(date)this.draft.date=date;
  if(/\bmorning\b/i.test(text))this.draft.period='morning';else if(/\bevening\b/i.test(text))this.draft.period='evening';else if(/\bafternoon\b/i.test(text))this.draft.period='afternoon';
 }
 if(!this.draft.doctor)return this.reply(`Which fictional doctor?${this.draft.date?' I remembered '+this.draft.date+'.':''}\nENT Doctor A: Mon–Fri, 11 AM–3 PM.\nENT Doctor B: Tue–Sat, 4 PM–7 PM.`,['ENT Doctor A','ENT Doctor B']);
 if(!this.draft.date)return this.reply('What date? Say tomorrow, Friday, or YYYY-MM-DD. All times are Philippine time.',['Tomorrow','Friday']);
 const a={doctor:this.draft.doctor,date:this.draft.date};
 if(this.stage==='confirm')return this.reply('Your reviewed booking is ready. Say “Confirm demo booking”, change the doctor/date, or start over.', ['Confirm demo booking','Start over']);
 if(!this.draft.time){
  const r=await this.call('list_demo_slots',a);let times=r.available_times;
  if(this.draft.period)times=times.filter(t=>this.draft.period==='morning'?t<'12:00':this.draft.period==='evening'?t>='17:00':t>='12:00'&&t<'17:00');
  if(!times.length){this.stage='collect';this.draft.period=null;return this.reply(`No matching slots for ENT Doctor ${a.doctor.toUpperCase()} on ${a.date}. Try another date, doctor, or “all times”.`,['All times','Tomorrow','ENT Doctor A','ENT Doctor B']);}
  const chosen=times.find(t=>text.toUpperCase()===clock(t)||text===t||text.toLowerCase()===clock(t).replace(':00','').toLowerCase());
  if(!chosen){this.stage='slot';return this.reply(`Available for ENT Doctor ${a.doctor.toUpperCase()} on ${a.date} (Philippine time). Choose a 30-minute slot:\n${times.map(clock).join(' · ')}`,times.map(clock));}
  this.draft.time=chosen;this.stage='patient';
 }
 let patient=this.o.patients.find(p=>p.name.toLowerCase()===q);
 if(/^(random|random patient|choose random demo patient)$/i.test(text))patient=this.o.patients[Math.floor(Math.random()*this.o.patients.length)];
 if(!patient)return this.reply(`Selected ${clock(this.draft.time)} on ${this.draft.date}. Choose a fictional adult. Please do not type real patient details.`,[...this.o.patients.map(p=>p.name),'Random patient']);
 this.pending={...a,time:this.draft.time,patient_id:patient.id,session_id:this.session,booking_id:this.id(),confirmation:'confirm_demo_booking'};this.stage='confirm';
 return this.reply(`Review fictional booking:\nENT Doctor ${a.doctor.toUpperCase()} · Ayala Center Cebu\n${a.date} · ${clock(this.draft.time)} · 30 minutes · Philippine time\n${patient.name} · ${patient.sex} · born ${patient.birth_date} · ${patient.city}\n${patient.email}\nNo slot is reserved until you explicitly confirm. No real appointment, email or SMS will be created.`,['Confirm demo booking','Start over']);
 }
 describe(b){return `${b.doctor} · ${b.date} · ${clock(b.time)} (Philippine time) · ${b.patient.name} (fictional)`}
 async list(){this.pending=null;this.stage='idle';this.draft={};const r=await this.call('list_demo_appointments',{session_id:this.session});return this.reply(r.bookings.length?r.bookings.map(b=>`${this.describe(b)}\n${b.status.toUpperCase()} · ${b.reference}`).join('\n\n'):'No demo reservations in this browser yet.',[...r.bookings.filter(b=>b.status==='confirmed').map(b=>'Cancel '+b.reference),'Book another appointment'])}
}
