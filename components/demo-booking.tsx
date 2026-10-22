"use client";
import { useEffect, useRef } from 'react';
export default function DemoBookingPanel(){
 const container=useRef<HTMLDivElement>(null);
 useEffect(()=>{let cancelled=false;import('../lib/booking-widget.mjs').then(()=>{if(!cancelled&&container.current){container.current.replaceChildren(document.createElement('demo-booking'))}});return()=>{cancelled=true}},[]);
 return <div ref={container} className="mx-auto w-full max-w-[1500px] px-5 pb-8 sm:px-8 lg:px-12" />;
}
