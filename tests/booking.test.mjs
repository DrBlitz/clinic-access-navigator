import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {scheduleSlots,runBookingTool} from '../lib/booking.mjs';
import {runTool} from '../lib/clinic-mcp.mjs';
import {createLocalBookingStore} from '../scripts/local-booking-store.mjs';
const now=new Date('2026-10-22T00:00:00Z');
const args=()=>({session_id:randomUUID(),booking_id:randomUUID(),doctor:'a',date:'2026-10-23',time:'11:00',patient_id:'p1',confirmation:'confirm_demo_booking'});
test('doctor schedules, Manila date window and past times',()=>{
 assert.deepEqual(scheduleSlots('a','2026-10-23',now),['11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30']);
 assert.deepEqual(scheduleSlots('b','2026-10-24',now),['16:00','16:30','17:00','17:30','18:00','18:30']);
 assert.deepEqual(scheduleSlots('a','2026-10-24',now),[]);
 assert.deepEqual(scheduleSlots('b','2026-10-26',now),[]);
 assert.deepEqual(scheduleSlots('a','2026-10-25',now),[]);
 assert.deepEqual(scheduleSlots('a','2026-10-22',new Date('2026-10-22T06:00:00Z')),['14:30']);
 for(const date of ['2026-02-30','2026-10-21','2026-11-22'])assert.throws(()=>scheduleSlots('a',date,now));
});
test('atomic competition, retries, ownership, cancellation and persistence',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'clinic-test-')); const path=join(dir,'bookings.sqlite');let store=createLocalBookingStore(path);
 const call=(name,a)=>runBookingTool(name,a,store,now);const a=args(),b=args();
 try{
 const results=await Promise.allSettled([call('book_demo_appointment',a),call('book_demo_appointment',b)]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const winner=results[0].status==='fulfilled'?a:b, loser=winner===a?b:a;
 assert.equal((await call('book_demo_appointment',winner)).booking.id,winner.booking_id);
 await assert.rejects(call('book_demo_appointment',{...winner,time:'11:30'}),/already used/);
 assert.equal((await call('list_demo_slots',{doctor:'a',date:a.date})).available_times.includes('11:00'),false);
 assert.equal((await call('list_demo_appointments',{session_id:loser.session_id})).bookings.length,0);
 store.close();store=createLocalBookingStore(path);
 assert.equal((await call('list_demo_appointments',winner)).bookings.length,1);
 await assert.rejects(call('cancel_demo_appointment',{...winner,session_id:loser.session_id,confirmation:'confirm_demo_cancellation'}),/not found/);
 await call('cancel_demo_appointment',{...winner,confirmation:'confirm_demo_cancellation'});
 await call('cancel_demo_appointment',{...winner,confirmation:'confirm_demo_cancellation'});
 assert.equal((await call('book_demo_appointment',loser)).booking.status,'confirmed');
 }finally{store.close();rmSync(dir,{recursive:true});}
});
test('MCP rejects arbitrary patient data and unconfirmed writes',()=>{
 for(const a of [{...args(),confirmation:''},{...args(),patient_id:'real-patient'},{...args(),name:'Real Person'},{...args(),session_id:'bad'}])assert.throws(()=>runTool('book_demo_appointment',a));
});
