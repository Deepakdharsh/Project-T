'use client';

import { useState, useEffect } from 'react';
import { ArrowRight, Instagram, Twitter, Facebook } from 'lucide-react';
import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { BookingSection } from './BookingSection';
import { PaymentInterface } from './PaymentInterface';
import { SuccessScreen } from './SuccessScreen';
import { AdminPanel } from './AdminPanel';
import { ToastPopup } from './ToastPopup';
import { INITIAL_SLOTS, INITIAL_BOOKINGS, INITIAL_CLOSURES, INITIAL_GAMES, INITIAL_CATEGORIES } from '@/data/mockData';
import type { Slot, Booking, Closure, BookingDetails } from '@/types';

export const App = () => {
  const [currentView, setCurrentView] = useState('home');
  const [masterSlots, setMasterSlots] = useState<Slot[]>(INITIAL_SLOTS);
  const [bookings, setBookings] = useState<Booking[]>(INITIAL_BOOKINGS);
  const [closures, setClosures] = useState<Closure[]>(INITIAL_CLOSURES);
  const [games] = useState(INITIAL_GAMES);
  const [categories] = useState(INITIAL_CATEGORIES);
  const [pendingBooking, setPendingBooking] = useState<BookingDetails | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [adminCreds, setAdminCreds] = useState({ username: '', password: '' });
  const [toast, setToast] = useState<any>(null);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleBookingProceed = (details: BookingDetails) => {
    setPendingBooking(details);
    setCurrentView('payment');
    window.scrollTo(0,0);
  };

  const handlePaymentSuccess = () => {
    if (!pendingBooking) return;
    const newId = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking: Booking = { 
      id: newId, 
      date: pendingBooking.date, 
      slots: pendingBooking.slots.map(s => s.time), 
      totalPrice: pendingBooking.total, 
      gameId: pendingBooking.gameId,
      gameName: pendingBooking.gameName,
      status: 'Confirmed',
      user: 'Guest User', 
      checkedInAt: null 
    };
    setBookings([newBooking, ...bookings]);
    setConfirmedBooking(newBooking);
    setCurrentView('success');
    window.scrollTo(0,0);
  };

  return (
    <div className="font-sans antialiased bg-black min-h-screen selection:bg-white selection:text-black">
      <ToastPopup notification={toast} onClose={() => setToast(null)} />

      {!['admin-dashboard'].includes(currentView) && (
        <Navbar onViewChange={setCurrentView} currentView={currentView} />
      )}

      {currentView === 'home' && (
        <>
          <Hero onBookNow={() => { setCurrentView('booking'); window.scrollTo(0,0); }} closures={closures} />
          
          <div className="bg-white text-black py-16 px-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <h3 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter">
                  Intention.<br/>Dedication.<br/>Fun.
                </h3>
                <p className="text-lg font-medium leading-relaxed border-l-4 border-black pl-6">
                  At 4Cantera, we believe in the power of intensity and a sense of belonging. 
                  Whether you are a club looking for growth or a player chasing a dream, 
                  we provide the platform to make it happen.
                </p>
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto py-24 px-6 lg:px-12">
            <div className="flex justify-between items-end mb-12">
               <h2 className="text-3xl font-bold text-white uppercase tracking-widest">Our Programs</h2>
               <button className="text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest">View All</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {[
                 { title: 'NextStep', age: '6 - 9 Years', desc: 'Take the next step in your development.' },
                 { title: 'Campus', age: '10 - 16 Years', desc: 'Where technique meets tactical insight.' },
                 { title: 'Events', age: 'All Ages', desc: 'Tournaments and camps for every level.' },
               ].map((prog, i) => (
                 <div key={i} className="group bg-zinc-900 border border-white/5 p-8 hover:bg-zinc-800 transition-colors cursor-pointer">
                   <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">0{i+1} — {prog.age}</div>
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-4 group-hover:translate-x-2 transition-transform">{prog.title}</h3>
                   <p className="text-zinc-400 mb-8">{prog.desc}</p>
                   <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                     <ArrowRight size={14} />
                   </div>
                 </div>
               ))}
            </div>
          </div>
          
          <footer className="bg-zinc-950 border-t border-white/10 pt-16 pb-8 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
              <div className="col-span-1 md:col-span-2">
                <span className="text-2xl font-black text-white uppercase italic tracking-tighter block mb-6">4Cantera.</span>
                <p className="text-zinc-500 max-w-sm">Savannestraat 51<br/>1448 WB Purmerend<br/>Netherlands</p>
              </div>
              <div>
                <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Social</h4>
                <div className="flex space-x-4 text-zinc-500">
                  <Instagram className="hover:text-white cursor-pointer" size={20} />
                  <Facebook className="hover:text-white cursor-pointer" size={20} />
                  <Twitter className="hover:text-white cursor-pointer" size={20} />
                </div>
              </div>
              <div>
                <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">Contact</h4>
                <p className="text-zinc-500 text-sm hover:text-white cursor-pointer">contact@4cantera.com</p>
              </div>
            </div>
            <div className="max-w-7xl mx-auto border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between text-zinc-600 text-xs uppercase tracking-widest">
              <span>© 2024 4Cantera. All rights reserved.</span>
              <div className="space-x-6 mt-4 md:mt-0">
                <span>Privacy</span>
                <span>Terms</span>
              </div>
            </div>
          </footer>
        </>
      )}

      {currentView === 'booking' && (
        <BookingSection 
          masterSlots={masterSlots} 
          bookings={bookings} 
          closures={closures} 
          games={games} 
          categories={categories} 
          onProceed={handleBookingProceed} 
        />
      )}

      {currentView === 'payment' && pendingBooking && (
        <PaymentInterface bookingDetails={pendingBooking} onPaymentComplete={handlePaymentSuccess} onBack={() => setCurrentView('booking')} />
      )}

      {currentView === 'success' && confirmedBooking && (
        <SuccessScreen bookingDetails={confirmedBooking} onHome={() => setCurrentView('home')} onToast={setToast} />
      )}

      {currentView === 'admin-login' && (
        <div className="min-h-screen flex items-center justify-center bg-black px-4">
          <div className="w-full max-w-md">
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter text-center mb-12">Admin Portal</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              if(adminCreds.username === 'admin' && adminCreds.password === 'admin') setCurrentView('admin-dashboard');
            }} className="space-y-6">
              <input type="text" placeholder="USERNAME" onChange={e => setAdminCreds({...adminCreds, username: e.target.value})} className="w-full bg-transparent border-b border-zinc-700 py-4 text-white placeholder-zinc-600 focus:border-white outline-none font-bold uppercase tracking-widest text-sm rounded-none" />
              <input type="password" placeholder="PASSWORD" onChange={e => setAdminCreds({...adminCreds, password: e.target.value})} className="w-full bg-transparent border-b border-zinc-700 py-4 text-white placeholder-zinc-600 focus:border-white outline-none font-bold uppercase tracking-widest text-sm rounded-none" />
              <button className="w-full bg-white text-black font-bold uppercase tracking-widest py-4 hover:bg-zinc-200 mt-8">Enter</button>
            </form>
          </div>
        </div>
      )}

      {currentView === 'admin-dashboard' && (
        <AdminPanel 
          masterSlots={masterSlots} 
          setMasterSlots={setMasterSlots} 
          allBookings={bookings}
          setBookings={setBookings}
          closures={closures}
          setClosures={setClosures}
          games={games}
          categories={categories}
          onLogout={() => setCurrentView('home')} 
        />
      )}
    </div>
  );
};

