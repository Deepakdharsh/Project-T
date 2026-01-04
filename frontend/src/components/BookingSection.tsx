'use client';

import { useState, useEffect } from 'react';
import { Ban, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/utils/validation';
import type { Slot, Booking, Closure, Game, Category, BookingDetails } from '@/types';

interface BookingSectionProps {
  masterSlots: Slot[];
  bookings: Booking[];
  closures: Closure[];
  games: Game[];
  categories: Category[];
  onProceed: (details: BookingDetails) => void;
}

export const BookingSection = ({ masterSlots, bookings, closures, games, categories, onProceed }: BookingSectionProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
  const [selectedGame, setSelectedGame] = useState(games.find(g => g.categoryId === categories[0]?.id)?.id || '');

  useEffect(() => {
    const firstGameInCategory = games.find(g => g.categoryId === selectedCategory);
    if (firstGameInCategory) setSelectedGame(firstGameInCategory.id);
  }, [selectedCategory, games]);
  
  const activeClosure = closures.find(c => c.date === selectedDate);
  const isFullClosure = activeClosure?.type === 'full';

  const isSlotBooked = (slot: Slot) => {
    const isBooked = bookings.some(b => 
      b.date === selectedDate && 
      b.slots.includes(slot.time) && 
      b.gameId === selectedGame &&
      b.status !== 'Cancelled'
    );
    if (isBooked) return { status: 'booked', label: 'SOLD OUT' };
    if (isFullClosure) return { status: 'closed', label: 'CLOSED', reason: activeClosure.reason };
    if (activeClosure?.type === 'partial') {
      if (slot.startHour >= (activeClosure.startHour || 0) && slot.startHour < (activeClosure.endHour || 24)) {
        return { status: 'closed', label: 'CLOSED', reason: activeClosure.reason };
      }
    }
    return null;
  };

  const handleSlotToggle = (slot: Slot) => {
    if (isSlotBooked(slot)) return;
    if (selectedSlotIds.includes(slot.id)) {
      setSelectedSlotIds(selectedSlotIds.filter(id => id !== slot.id));
    } else {
      setSelectedSlotIds([...selectedSlotIds, slot.id]);
    }
  };

  const selectedSlots = masterSlots.filter(s => selectedSlotIds.includes(s.id));
  const totalPrice = selectedSlots.reduce((sum, slot) => sum + slot.price, 0);
  const currentGameObj = games.find(g => g.id === selectedGame);

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-24 md:pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
        <div className="mb-8 md:mb-12 border-b border-white/10 pb-8">
          <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">Book Your Slot</h1>
          <p className="text-zinc-500 font-medium text-sm md:text-base">Select your game, date, and time.</p>
        </div>

        <div className="mb-12 space-y-6">
          <div className="flex gap-4 border-b border-zinc-800 pb-4 overflow-x-auto scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`text-sm font-bold uppercase tracking-widest whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-4">
            {games.filter(g => g.categoryId === selectedCategory).map(game => (
              <button
                key={game.id}
                onClick={() => { setSelectedGame(game.id); setSelectedSlotIds([]); }}
                className={`px-6 py-3 text-xs font-bold uppercase tracking-widest border transition-all ${selectedGame === game.id ? 'bg-white text-black border-white' : 'bg-transparent border-zinc-700 text-zinc-500 hover:border-zinc-500'}`}
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>

        {activeClosure && (
          <div className="mb-8 bg-red-950/20 border border-red-900 p-4 md:p-6 flex items-start gap-4 animate-fade-in rounded-none md:rounded">
             <AlertTriangle className="text-red-500 shrink-0 mt-1" />
             <div>
               <h3 className="text-red-500 font-bold uppercase tracking-widest text-xs md:text-sm mb-1">
                 {activeClosure.type === 'full' ? 'Turf Closed All Day' : 'Partial Closure in Effect'}
               </h3>
               <p className="text-zinc-400 text-xs md:text-sm">
                 <span className="text-white font-medium">{activeClosure.reason}</span> 
                 {activeClosure.note && <span className="text-zinc-500"> — {activeClosure.note}</span>}
               </p>
             </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          <div className="lg:col-span-8 space-y-8">
            <div className="bg-zinc-900/50 p-6 border border-white/5">
              <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Select Date</label>
              <input 
                type="date" 
                value={selectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedSlotIds([]);
                }}
                className="w-full bg-black text-white border border-zinc-700 px-4 py-4 focus:ring-1 focus:ring-white outline-none text-lg font-mono placeholder-zinc-600 appearance-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Available Times</span>
                <span className="text-xs text-zinc-600">{new Date(selectedDate).toLocaleDateString('en-NL', { weekday: 'long', month: 'long', day: 'numeric'})}</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {masterSlots.filter(s => s.active && s.gameId === selectedGame).map((slot) => {
                  const statusObj = isSlotBooked(slot);
                  const isUnavailable = !!statusObj;
                  const selected = selectedSlotIds.includes(slot.id);

                  return (
                    <button
                      key={slot.id}
                      disabled={isUnavailable}
                      onClick={() => handleSlotToggle(slot)}
                      className={`
                        group relative p-6 border transition-all duration-300 flex flex-col items-start min-h-[140px]
                        ${isUnavailable 
                          ? 'bg-zinc-950 border-zinc-900 text-zinc-700 cursor-not-allowed opacity-70' 
                          : selected 
                            ? 'bg-white border-white text-black' 
                            : 'bg-black border-zinc-700 text-white hover:border-white'}
                      `}
                    >
                      <div className="flex justify-between w-full">
                         <span className="text-2xl font-bold italic mb-1">{slot.time}</span>
                         {statusObj?.status === 'closed' && <Ban className="w-5 h-5 text-red-900" />}
                      </div>
                      
                      <div className="w-full flex justify-between items-end mt-auto pt-4">
                        <span className={`text-sm font-medium ${selected ? 'text-zinc-600' : 'text-zinc-500'}`}>
                          {statusObj?.status === 'closed' ? statusObj.reason : currentGameObj?.name}
                        </span>
                        <span className={`text-lg font-bold ${statusObj?.status === 'closed' ? 'text-red-900' : ''}`}>
                          {isUnavailable ? statusObj.label : formatCurrency(slot.price)}
                        </span>
                      </div>
                      {selected && <div className="absolute top-4 right-4 w-3 h-3 bg-black rounded-full" />}
                    </button>
                  );
                })}
              </div>
              {masterSlots.filter(s => s.active && s.gameId === selectedGame).length === 0 && (
                <div className="text-zinc-500 italic text-sm text-center py-10">No slots available for {currentGameObj?.name} on this day.</div>
              )}
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 bg-zinc-900 border border-white/10 p-8">
              <h3 className="text-xl font-black uppercase italic tracking-tighter mb-6 border-b border-white/10 pb-4">
                Reservation
              </h3>
              
              <div className="space-y-6 mb-8">
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest">Game</label>
                  <div className="text-lg font-medium">{currentGameObj?.name}</div>
                </div>
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest">Date</label>
                  <div className="text-lg font-medium">{selectedDate}</div>
                </div>
                
                <div>
                  <label className="text-xs text-zinc-500 uppercase tracking-widest">Slots</label>
                  {selectedSlots.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {selectedSlots.map(slot => (
                        <div key={slot.id} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                          <span className="font-mono text-zinc-300">{slot.time}</span>
                          <span className="font-bold">{formatCurrency(slot.price)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-zinc-600 italic mt-1">No slots selected</div>
                  )}
                </div>

                <div className="flex justify-between items-end pt-4">
                  <span className="text-sm font-bold uppercase text-zinc-400">Total</span>
                  <span className="text-3xl font-black italic">{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <button
                disabled={selectedSlots.length === 0}
                onClick={() => onProceed({ date: selectedDate, slots: selectedSlots, total: totalPrice, gameName: currentGameObj?.name || '', gameId: selectedGame })}
                className={`
                  w-full py-4 text-sm font-bold uppercase tracking-widest transition-all
                  ${selectedSlots.length === 0 
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                    : 'bg-white text-black hover:bg-zinc-200'}
                `}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>

        </div>
      </div>

      <div className={`fixed bottom-0 left-0 w-full bg-zinc-900 border-t border-white/10 p-4 lg:hidden transition-transform duration-300 ${selectedSlots.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div>
            <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest block">{selectedSlots.length} Slots Selected</span>
            <span className="text-white text-2xl font-black italic">{formatCurrency(totalPrice)}</span>
          </div>
          <button 
            onClick={() => onProceed({ date: selectedDate, slots: selectedSlots, total: totalPrice, gameName: currentGameObj?.name || '', gameId: selectedGame })}
            className="bg-white text-black px-8 py-3 font-bold uppercase tracking-widest text-xs"
          >
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

