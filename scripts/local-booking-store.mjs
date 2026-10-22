import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync } from 'node:fs';
import { createBookingStore } from '../lib/booking.mjs';
export function createLocalBookingStore(path){
 if(!path){mkdirSync(new URL('../.demo-data/',import.meta.url),{recursive:true});path=new URL('../.demo-data/bookings.sqlite',import.meta.url)}
 const db=new DatabaseSync(path);
 const exists=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='demo_bookings'").get();
 if(!exists)db.exec(readFileSync(new URL('../drizzle/0000_jazzy_kulan_gath.sql',import.meta.url),'utf8'));
 const store=createBookingStore({prepare(sql){return {bind(...args){return {async all(){return {results:db.prepare(sql).all(...args)}},async run(){return db.prepare(sql).run(...args)}}}}}});
 store.close=()=>db.close();return store;
}
