"use client";

import DemoBookingPanel from "@/components/demo-booking";
import { FormEvent, useState, useRef, useEffect } from "react";
import { AlertTriangle, CalendarDays, Check, Clock3, LoaderCircle, MapPin, Send, ShieldCheck, Sparkles, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { ClinicConversation, demoSession } from "@/lib/conversation.mjs";
import { callClinicTool } from "@/lib/clinic-client.mjs";

type Message = { role: "assistant" | "user"; text: string; tool?: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: "Hello! I can help book a fictional ENT appointment at Ayala, remember your choices during this chat, and manage your demo reservations. Try “Book an ENT consultation Friday afternoon”. Use fictional patient presets only." }]);
  const [trace, setTrace] = useState<{method: string; status: number; result: unknown}[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if(logRef.current) logRef.current.scrollTop=logRef.current.scrollHeight; }, [messages, busy]);
  const conversation = useRef<any>(null);
  const sending = useRef(false);
  const [choices, setChoices] = useState<string[]>(["Book an ENT consultation Friday afternoon", "My appointments", "Ayala branch information"]);

  async function sendMessage(text: string) {
    const clean = text.trim();
    if (!clean || sending.current) return;
    sending.current = true;
    setTrace([]);

    setMessages((current) => [...current, { role: "user", text: clean }]);
    setInput("");
    setBusy(true);
    setActiveTool("conversation");
    try {
      if (!conversation.current) conversation.current = new ClinicConversation(async (name: string, args: any) => {
        setActiveTool(name);
        const result = await callClinicTool({name, arguments:args}, fetch, (entry: {method:string;status:number;result:unknown}) => setTrace(current => [...current, entry]));
        if (name === 'book_demo_appointment' || name === 'cancel_demo_appointment') window.dispatchEvent(new Event('clinic-bookings-changed'));
        return result;
      }, demoSession());
      const reply = await conversation.current.send(clean);
      setChoices(reply.choices);
      setMessages(current => [...current, {role:'assistant',text:reply.text}]);
    } catch (error) {
      setMessages(current => [...current, {role:'assistant',text: error instanceof Error ? error.message + " You can retry, choose another date, or start over. If confirmation timed out, check My appointments before starting another booking." : "The request could not be completed. Please try again.", tool:'connection_error'}]);
      setChoices(conversation.current?.choices || ['Start over','My appointments']);
    } finally {
      setBusy(false);
      sending.current = false;
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    sendMessage(input);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_72%_8%,rgba(49,134,255,0.15),transparent_32%),linear-gradient(145deg,#07101e_0%,#0b1728_48%,#07101b_100%)] text-white">
      <header className="mx-auto flex w-full max-w-[1500px] items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-[14px] bg-[#2c7cff] shadow-[0_10px_32px_rgba(44,124,255,0.35)]"><Stethoscope className="size-5" /></div>
          <div><p className="font-semibold tracking-[-0.02em]">Clinic Access Navigator</p><p className="text-sm text-slate-400">Alexa+ track · Simulated experience</p></div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 sm:flex">
          <span className="size-2 rounded-full bg-emerald-400" />Rule-based demo · fictional bookings
        </div>
      </header>


      <section className="mx-auto grid w-full max-w-[1500px] gap-5 px-5 pb-8 sm:px-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:px-12">
        <div className="flex min-h-[calc(100vh-116px)] flex-col overflow-hidden rounded-[28px] border border-white/10 bg-[#0b1727]/85 shadow-2xl shadow-black/25 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="relative grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#55a4ff] to-[#6857ff]"><Sparkles className="size-5" /><span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-[#0b1727] bg-emerald-400" /></div>
              <div><h1 className="font-semibold">Clinic assistant</h1><p className="text-sm text-slate-400">Guided booking · context lasts for this page session</p></div>
            </div>
            <ShieldCheck className="size-5 text-emerald-400" aria-label="Synthetic data only" />
          </div>

          <div ref={logRef} role="log" aria-live="polite" className="flex max-h-[65vh] min-h-80 flex-1 flex-col gap-5 overflow-y-auto px-5 py-6 sm:px-8">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-base leading-7 sm:max-w-[72%] ${message.role === "user" ? "rounded-br-md bg-[#2c7cff]" : "rounded-bl-md border border-white/10 bg-white/[0.06] text-slate-100"}`}>
                  <span className="whitespace-pre-wrap">{message.text}</span>
                  {message.tool && <div className="mt-2 flex items-center gap-1.5 border-t border-white/10 pt-2 text-xs text-slate-400">{message.tool === "connection_error" ? <AlertTriangle className="size-3.5 text-amber-300" /> : <Check className="size-3.5 text-emerald-400" />}MCP · <code>{message.tool}</code></div>}
                </div>
              </div>
            ))}
            {busy && <div className="flex justify-start"><div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-slate-300"><LoaderCircle className="size-4 animate-spin text-[#76afff]" />Calling <code>{activeTool}</code></div></div>}
            {<div className="flex flex-wrap gap-2">{choices.map((suggestion) => <button disabled={busy} key={suggestion} onClick={() => sendMessage(suggestion)} className="rounded-full border border-[#2c7cff]/35 bg-[#2c7cff]/10 px-4 py-2 text-sm text-[#a9ceff] transition hover:bg-[#2c7cff]/20">{suggestion}</button>)}</div>}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-white/10 bg-[#081422]/70 p-4 sm:p-5">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] p-2 focus-within:border-[#3988ff]/70 focus-within:ring-4 focus-within:ring-[#3988ff]/10">
              <Input maxLength={1000} value={input} onChange={(event) => setInput(event.target.value)} disabled={busy} placeholder="Book an appointment, choose a time, or view reservations…" aria-label="Message the clinic assistant" className="h-12 border-0 bg-transparent text-base text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0" />
              <Button type="submit" size="icon" disabled={input.trim().length < 1 || busy} className="size-11 shrink-0 rounded-xl bg-[#2c7cff] text-white hover:bg-[#4b90ff] disabled:opacity-40" aria-label="Send message"><Send className="size-5" /></Button>
            </div>
            <p className="mt-3 text-center text-xs leading-5 text-slate-500">Synthetic information only. This prototype does not provide emergency or diagnostic services.</p>
          </form>
        </div>

        <aside className="grid content-start gap-5">
          <section className="rounded-[28px] border border-white/10 bg-white/[0.055] p-6 backdrop-blur-xl">
            <p className="text-sm font-medium text-[#83b9ff]">Sample context</p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">iHearBetterNow · Demo</h2>
            <div className="mt-5 grid gap-3">
              <Info icon={MapPin} title="Ayala Center Cebu" detail="Sun–Thu 10 AM–9 PM · Fri–Sat 10 AM–10 PM" />
              <Info icon={CalendarDays} title="Fictional ENT schedules" detail="A: Mon–Fri 11 AM–3 PM · B: Tue–Sat 4 PM–7 PM" />
            </div>
          </section>
          <section className="rounded-[28px] border border-white/10 bg-[#101e31]/80 p-6">
            <p className="text-sm font-medium text-slate-400">MCP tools available</p><p className="mt-1 text-xs text-slate-500">Protocol 2025-11-25 · Streamable HTTP</p>
            <div className="mt-4 grid gap-3">
              <Tool icon={CalendarDays} label="list_demo_slots" />
              <Tool icon={Check} label="book_demo_appointment" />
              <Tool icon={CalendarDays} label="list_demo_appointments" />
              <Tool icon={Check} label="cancel_demo_appointment" />
              <Tool icon={MapPin} label="get_branch_information" />
              <Tool icon={Clock3} label="check_appointment_availability" />
              <Tool icon={Check} label="get_visit_preparation" />
              <Tool icon={AlertTriangle} label="find_clinic_service" />
            </div>
          </section>
          <section className="rounded-[28px] border border-white/10 bg-[#101e31]/80 p-6">
            <h2 className="font-semibold">Live MCP exchange</h2>
            <p className="mt-1 text-xs leading-5 text-slate-400">Real requests to /api/mcp. The Site runs this server; AWS deployment is separate.</p>
            {trace.length === 0 && <p className="mt-4 text-sm text-slate-500">Send a message to inspect the protocol.</p>}
            <div className="mt-3 grid gap-2">{trace.map((entry, index) => <details key={index} className="rounded-lg bg-black/20 p-3"><summary className="cursor-pointer text-xs text-blue-200">{entry.method} · HTTP {entry.status}</summary><pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs text-slate-300">{JSON.stringify(entry.result, null, 2)}</pre></details>)}</div>
          </section>
          <section className="rounded-[28px] border border-amber-300/15 bg-amber-300/[0.05] p-5 text-sm leading-6 text-amber-100/80">
            <p className="font-medium text-amber-100">Safety boundary</p>
            <p className="mt-1">This demo cannot assess urgency or rule out an emergency. For sudden hearing loss or other urgent symptoms, seek in-person medical care. No microphone or real Alexa connection is active.</p>
          </section>
        </aside>
      </section>
      <details className="mx-auto max-w-[1500px] px-5 pb-8"><summary className="cursor-pointer py-4 text-blue-200">Prefer a form? Open the demo booking panel</summary><DemoBookingPanel /></details>
    </main>
  );
}

function Info({ icon: Icon, title, detail }: { icon: typeof MapPin; title: string; detail: string }) {
  return <div className="flex items-start gap-3 rounded-2xl bg-black/15 p-4"><Icon className="mt-0.5 size-5 shrink-0 text-[#68a9ff]" /><div><p className="font-medium">{title}</p><p className="mt-1 text-sm text-slate-400">{detail}</p></div></div>;
}

function Tool({ icon: Icon, label }: { icon: typeof MapPin; label: string }) {
  return <div className="flex items-center gap-3 text-sm text-slate-300"><span className="grid size-8 place-items-center rounded-lg bg-white/[0.06]"><Icon className="size-4 text-[#76afff]" /></span><code className="min-w-0 break-all">{label}</code></div>;
}
