import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {ClinicConversation,dateFrom} from '../lib/conversation.mjs';
import {runBookingTool} from '../lib/booking.mjs';
import {createLocalBookingStore} from '../scripts/local-booking-store.mjs';
const now=new Date('2026-10-22T00:00:00Z');
function setup(){const store=createLocalBookingStore(':memory:');const calls=[];const c=new ClinicConversation(async(n,a)=>{calls.push(n);return runBookingTool(n,a,store,now)},randomUUID(),randomUUID);return {store,c,calls}}
test('contextual booking, explicit confirmation, retrieval and cancellation',async()=>{const {store,c,calls}=setup();try{
 assert.match((await c.send('Book an ENT consultation Friday afternoon')).text,/Which fictional doctor/);
 const slots=await c.send('Doctor A');assert.deepEqual(slots.choices,['12:00 PM','12:30 PM','1:00 PM','1:30 PM','2:00 PM','2:30 PM']);
 assert.match((await c.send('1:00 PM')).text,/fictional adult/);
 assert.match((await c.send('Miguel Santos')).text,/Review fictional booking/);
 await c.send('yes');assert.ok(!calls.includes('book_demo_appointment'));
 assert.match((await c.send('Confirm demo booking')).text,/Demo booking confirmed/);
 const list=await c.send('My appointments');assert.match(list.text,/CONFIRMED/);
 await c.send(list.choices[0]);assert.ok(!calls.includes('cancel_demo_appointment'));
 assert.match((await c.send('Confirm demo cancellation')).text,/cancelled/);
 assert.match((await c.send('My appointments')).text,/CANCELLED/);
}finally{store.close()}});
test('new date invalidates review and restart does not mutate',async()=>{const {store,c,calls}=setup();try{
 await c.send('book Doctor B tomorrow');await c.send('4:00 PM');await c.send('Random patient');
 await c.send('Saturday');assert.equal(c.pending,null);await c.send('Confirm demo booking');assert.ok(!calls.includes('book_demo_appointment'));
 await c.send('Start over');assert.equal(c.stage,'idle');
 assert.match((await c.send('Cancel DEMO-does-not-exist')).text,/not found/);
}finally{store.close()}});
test('date interpretation is anchored to Manila server date',()=>{assert.equal(dateFrom('Friday','2026-10-22'),'2026-10-23');assert.equal(dateFrom('tomorrow','2026-10-22'),'2026-10-23');assert.equal(dateFrom('next Friday','2026-10-23'),'2026-10-30')});
