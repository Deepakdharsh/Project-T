'use client';

import { ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface Closure {
  id: string;
  type: 'full' | 'partial';
  date: string;
  startHour?: number;
  endHour?: number;
  reason: string;
  note?: string;
}

interface HeroProps {
  onBookNow: () => void;
  closures: Closure[];
}

export const Hero = ({ onBookNow, closures }: HeroProps) => {
  const today = new Date().toISOString().split('T')[0];
  const todayClosure = closures.find(c => c.date === today && c.type === 'full');
  const currentHour = new Date().getHours();
  const partialClosureNow = closures.find(c => 
    c.date === today && c.type === 'partial' && currentHour >= (c.startHour || 0) && currentHour < (c.endHour || 24)
  );
  const isClosedNow = todayClosure || partialClosureNow;
  const statusReason = todayClosure?.reason || partialClosureNow?.reason;

  return (
    <div className="relative bg-black min-h-screen flex items-center">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-zinc-900/30 skew-x-12 transform origin-top translate-x-1/4"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?q=80&w=2000&auto=format&fit=crop" 
          alt="Football Training" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale"
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-12 w-full pt-20">
        <div className="max-w-4xl animate-fade-in-up">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className={`px-4 py-2 border ${isClosedNow ? 'border-red-500 bg-red-950/30' : 'border-green-500 bg-green-950/30'} backdrop-blur-md flex items-center gap-2`}>
              <div className={`w-2 h-2 rounded-full ${isClosedNow ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
              <span className={`text-xs font-bold uppercase tracking-widest ${isClosedNow ? 'text-red-500' : 'text-green-500'}`}>
                {isClosedNow ? `CLOSED: ${statusReason}` : 'LIVE STATUS: OPEN'}
              </span>
            </div>
          </div>

          <h2 className="text-zinc-400 font-bold tracking-[0.2em] text-xs md:text-sm uppercase mb-4 md:mb-6">
            Where Clubs and Talent Meet
          </h2>
          <h1 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.9] mb-8">
            Our Vision.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-500">
              Your Potential.
            </span>
          </h1>
          <p className="text-base md:text-lg text-zinc-400 max-w-xl mb-10 font-medium leading-relaxed">
            The platform that helps players and clubs grow—with vision, fun, and a personal plan.
            Experience professional facilities designed for the elite.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button 
              onClick={onBookNow}
              disabled={!!todayClosure} 
              className={`w-full sm:w-auto px-8 py-5 text-sm font-bold uppercase tracking-widest flex items-center justify-center group transition-colors ${!!todayClosure ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'}`}
            >
              {todayClosure ? 'Closed Today' : 'Start Your Journey'} <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <Link
              href="/gallery"
              className="w-full sm:w-auto px-8 py-5 border border-white/30 text-white text-sm font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-center"
            >
              Explore Gallery
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

