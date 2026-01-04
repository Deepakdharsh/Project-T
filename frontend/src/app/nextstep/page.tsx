import { Navbar } from "@/components/Navbar";
import Link from "next/link";

export default function NextStepPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">NextStep</h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed mb-10">
            Take the next step in development. A fun foundation program for players aged 6–9.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-zinc-900/50 border border-white/10 p-8">
              <h2 className="text-xl font-black uppercase italic tracking-tighter mb-4">Focus areas</h2>
              <ul className="space-y-2 text-zinc-300">
                <li>Ball control &amp; coordination</li>
                <li>Basic passing &amp; dribbling</li>
                <li>Fun games &amp; teamwork</li>
                <li>Confidence building</li>
              </ul>
            </div>
            <div className="bg-zinc-900/50 border border-white/10 p-8">
              <h2 className="text-xl font-black uppercase italic tracking-tighter mb-4">Book a slot</h2>
              <p className="text-zinc-400 mb-6">Reserve time for training sessions.</p>
              <Link
                href="/booking"
                className="inline-flex bg-white text-black px-6 py-3 font-bold uppercase tracking-widest text-xs hover:bg-zinc-200 transition-colors"
              >
                Book Turf
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


