'use client';

import { useState, useEffect } from 'react';
import { 
  ScanLine, List, Clock, Wrench, LogOut, Menu, X, QrCode, Check, 
  XCircle, Trash2, CheckCircle, AlertTriangle
} from 'lucide-react';
import { ToastPopup } from './ToastPopup';
import { formatTimeRange, formatTimeRange24 } from '@/utils/timeUtils';
import type { Slot, Booking, Closure, Game, Category } from '@/types';

interface AdminPanelProps {
  masterSlots: Slot[];
  setMasterSlots: (slots: Slot[]) => void;
  allBookings: Booking[];
  setBookings: (bookings: Booking[]) => void;
  closures: Closure[];
  setClosures: (closures: Closure[]) => void;
  games: Game[];
  categories: Category[];
  onLogout: () => void;
}

export const AdminPanel = ({ 
  masterSlots, setMasterSlots, allBookings, setBookings, closures, setClosures, 
  games, categories, onLogout 
}: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState('checkin');
  const [checkInId, setCheckInId] = useState('');
  const [notification, setNotification] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedAdminGame, setSelectedAdminGame] = useState(games[0]?.id || '');
  const [slotFormData, setSlotFormData] = useState({ startHour: '', endHour: '', timeFormat: '12h' });
  
  const [closureForm, setClosureForm] = useState({
    type: 'full' as 'full' | 'partial', 
    date: '', 
    startHour: 18, 
    endHour: 22, 
    reason: 'Maintenance', 
    note: ''
  });

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const toggleSlotStatus = (id: number) => {
    setMasterSlots(masterSlots.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const updatePrice = (id: number, newPrice: string) => {
    setMasterSlots(masterSlots.map(s => s.id === id ? { ...s, price: Number(newPrice) } : s));
  };

  const addSlot = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    
    const startHour = parseInt(slotFormData.startHour || formData.get('startHour') as string);
    const endHour = parseInt(slotFormData.endHour || formData.get('endHour') as string);
    const price = parseFloat(formData.get('price') as string);
    const timeFormat = slotFormData.timeFormat || (formData.get('timeFormat') as string);
    
    // Validation
    if (isNaN(startHour) || isNaN(endHour)) {
      setNotification({ type: 'error', title: 'Invalid Time', message: 'Please enter valid start and end times.' });
      return;
    }
    
    if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
      setNotification({ type: 'error', title: 'Invalid Time', message: 'Hours must be between 0 and 23.' });
      return;
    }
    
    if (startHour >= endHour) {
      setNotification({ type: 'error', title: 'Invalid Time Range', message: 'End time must be after start time.' });
      return;
    }
    
    if (endHour - startHour > 12) {
      setNotification({ type: 'error', title: 'Invalid Duration', message: 'Slot duration cannot exceed 12 hours.' });
      return;
    }
    
    if (isNaN(price) || price <= 0) {
      setNotification({ type: 'error', title: 'Invalid Price', message: 'Price must be a positive number.' });
      return;
    }
    
    if (price > 10000) {
      setNotification({ type: 'error', title: 'Invalid Price', message: 'Price cannot exceed €10,000.' });
      return;
    }
    
    // Check for duplicate slot time
    const existingSlot = masterSlots.find(
      s => s.gameId === selectedAdminGame && s.startHour === startHour
    );
    if (existingSlot) {
      setNotification({ type: 'error', title: 'Duplicate Slot', message: 'A slot already exists at this start time for this game.' });
      return;
    }
    
    // Generate time display based on format preference
    const timeDisplay = timeFormat === '12h' 
      ? formatTimeRange(startHour, endHour)
      : formatTimeRange24(startHour, endHour);
    
    const newSlot: Slot = {
      id: Date.now(),
      gameId: selectedAdminGame,
      time: timeDisplay,
      startHour: startHour,
      price: Math.round(price),
      active: true
    };
    
    setMasterSlots([...masterSlots, newSlot]);
    setNotification({ type: 'success', title: 'Slot Added', message: `New slot created: ${timeDisplay} (€${Math.round(price)})` });
    setSlotFormData({ startHour: '', endHour: '', timeFormat: '12h' });
    (e.target as HTMLFormElement).reset();
  };

  const addClosure = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newClosure: Closure = { 
      id: `CL-${Date.now()}`, 
      ...closureForm, 
      startHour: Number(closureForm.startHour), 
      endHour: Number(closureForm.endHour) 
    };
    setClosures([...closures, newClosure]);
    setNotification({ type: 'success', title: 'Closure Active', message: 'The closure rule has been applied.' });
    setClosureForm({ ...closureForm, note: '' });
  };

  const deleteClosure = (id: string) => {
    if(confirm('Remove this closure rule?')) setClosures(closures.filter(c => c.id !== id));
  };

  const handleStatusChange = (bookingId: string, newStatus: Booking['status']) => {
    const booking = allBookings.find(b => b.id === bookingId);
    
    if (booking?.status === 'Cancelled' && newStatus !== 'Cancelled') {
      setNotification({ type: 'error', title: 'Action Denied', message: 'Cannot restore a cancelled booking.' });
      return;
    }

    const updatedBookings = allBookings.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);
    setBookings(updatedBookings);
    setNotification({ type: 'success', title: 'Status Updated', message: `Booking marked as ${newStatus}` });
  };

  const handleDeleteBooking = (bookingId: string) => {
    if(confirm('Are you sure you want to permanently delete this booking? This cannot be undone.')) {
        setBookings(allBookings.filter(b => b.id !== bookingId));
        setNotification({ type: 'info', title: 'Booking Deleted', message: 'Record removed permanently.' });
    }
  };

  const handleCheckIn = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const booking = allBookings.find(b => b.id === checkInId.trim());
    if (!booking) {
      setNotification({ type: 'error', title: 'Scan Failed', message: 'Invalid or missing Order ID.' });
      return;
    }
    if (booking.status === 'Cancelled') {
      setNotification({ type: 'error', title: 'Cancelled', message: 'This booking was cancelled.' });
      return;
    }
    if (booking.status === 'Checked In') {
      setNotification({ type: 'error', title: 'Already Used', message: `Order ${booking.id} was already checked in.` });
      return;
    }
    
    handleStatusChange(booking.id, 'Checked In');
    setNotification({ 
      type: 'success', 
      title: 'Check-in Verified', 
      message: 'Access granted successfully.',
      details: { 
        game: booking.gameName,
        user: booking.user || 'Guest User', 
        id: booking.id, 
        slots: booking.slots.join(', ') 
      }
    });
    setCheckInId('');
  };

  const SidebarContent = () => (
    <>
       <div className="h-20 flex items-center px-6 border-b border-white/5">
          <span className="font-bold text-lg italic tracking-tighter">4CANTERA ADMIN</span>
          <button className="ml-auto md:hidden" onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
        </div>
        <div className="p-4 space-y-1">
          <button onClick={() => { setActiveTab('checkin'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'checkin' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
             <ScanLine size={16} className="mr-3" /> Check-In
          </button>
          <button onClick={() => { setActiveTab('bookings'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'bookings' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
             <List size={16} className="mr-3" /> Bookings
          </button>
          <button onClick={() => { setActiveTab('slots'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'slots' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
             <Clock size={16} className="mr-3" /> Slots
          </button>
          <button onClick={() => { setActiveTab('closures'); setIsSidebarOpen(false); }} className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-wider ${activeTab === 'closures' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
             <Wrench size={16} className="mr-3" /> Facilities
          </button>
        </div>
        <div className="absolute bottom-0 w-full p-4 border-t border-white/5">
          <button onClick={onLogout} className="flex items-center text-zinc-500 hover:text-red-500 text-xs font-bold uppercase tracking-wider">
            <LogOut size={14} className="mr-2" /> Logout
          </button>
        </div>
    </>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col md:flex-row relative">
      <ToastPopup notification={notification} onClose={() => setNotification(null)} />

      <div className="md:hidden h-16 bg-black border-b border-white/10 flex items-center px-4 justify-between">
        <span className="font-bold italic tracking-tighter">ADMIN DASHBOARD</span>
        <button onClick={() => setIsSidebarOpen(true)}><Menu/></button>
      </div>

      <div className="w-64 border-r border-white/5 bg-black hidden md:block relative">
        <SidebarContent />
      </div>

      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black md:hidden animate-slide-in-left">
          <SidebarContent />
        </div>
      )}

      <div className="flex-1 p-4 md:p-8 overflow-y-auto">
        <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-8">
          {activeTab === 'checkin' ? 'Ground Check-In' : activeTab === 'slots' ? 'Manage Availability' : activeTab === 'bookings' ? 'Booking Registry' : 'Facility Closure'}
        </h1>

        {activeTab === 'checkin' && (
           <div className="max-w-xl">
             <div className="bg-black border border-white/10 p-6 md:p-8 text-center mb-8">
               <QrCode size={48} className="mx-auto text-zinc-500 mb-4" />
               <h3 className="text-xl font-bold uppercase italic tracking-tighter mb-2">Scan or Enter ID</h3>
               <p className="text-zinc-500 text-sm mb-6">Enter Order ID from customer's QR code.</p>
               <form onSubmit={handleCheckIn} className="flex flex-col sm:flex-row gap-4">
                 <input autoFocus type="text" placeholder="e.g. BK-1234" value={checkInId} onChange={(e) => setCheckInId(e.target.value)} className="flex-1 bg-zinc-900 border border-zinc-700 p-4 text-white text-center font-mono text-lg uppercase outline-none focus:border-white rounded-none" />
                 <button type="submit" className="bg-white text-black px-8 py-4 font-bold uppercase tracking-widest hover:bg-zinc-200">Verify</button>
               </form>
             </div>
           </div>
        )}

        {activeTab === 'slots' && (
          <div>
            <div className="mb-6 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {games.map(game => (
                <button
                  key={game.id}
                  onClick={() => setSelectedAdminGame(game.id)}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap ${selectedAdminGame === game.id ? 'bg-white text-black border-white' : 'border-zinc-800 text-zinc-500 hover:border-zinc-500'}`}
                >
                  {game.name}
                </button>
              ))}
            </div>

            <div className="bg-black border border-white/10 p-6 md:p-8 mb-6">
              <h3 className="text-sm font-bold uppercase mb-6 text-zinc-300 flex items-center gap-2">
                <Clock size={16} />
                Add New Slot for {games.find(g => g.id === selectedAdminGame)?.name}
              </h3>
              
              <form onSubmit={addSlot} className="space-y-6">
                {/* Time Format Selection */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Time Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="timeFormat" 
                        value="12h" 
                        checked={slotFormData.timeFormat === '12h'}
                        onChange={(e) => setSlotFormData({...slotFormData, timeFormat: e.target.value})}
                        className="w-4 h-4 accent-white"
                      />
                      <span className="text-sm text-zinc-300">12-hour (AM/PM)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="timeFormat" 
                        value="24h"
                        checked={slotFormData.timeFormat === '24h'}
                        onChange={(e) => setSlotFormData({...slotFormData, timeFormat: e.target.value})}
                        className="w-4 h-4 accent-white"
                      />
                      <span className="text-sm text-zinc-300">24-hour</span>
                    </label>
                  </div>
                </div>

                {/* Time Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                      Start Time
                    </label>
                    <input 
                      name="startHour" 
                      type="number" 
                      placeholder="18" 
                      required 
                      min="0"
                      max="23"
                      value={slotFormData.startHour}
                      onChange={(e) => setSlotFormData({...slotFormData, startHour: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none focus:border-white transition-colors text-center font-mono text-lg" 
                    />
                    <p className="text-[10px] text-zinc-600 mt-1.5">
                      0-23 (24-hour format)
                      {slotFormData.startHour && !isNaN(parseInt(slotFormData.startHour)) && (
                        <span className="ml-2 text-zinc-500">
                          = {formatTimeRange(parseInt(slotFormData.startHour), parseInt(slotFormData.startHour) + 1).split(' - ')[0]}
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                      End Time
                    </label>
                    <input 
                      name="endHour" 
                      type="number" 
                      placeholder="19" 
                      required 
                      min="0"
                      max="23"
                      value={slotFormData.endHour}
                      onChange={(e) => setSlotFormData({...slotFormData, endHour: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none focus:border-white transition-colors text-center font-mono text-lg" 
                    />
                    <p className="text-[10px] text-zinc-600 mt-1.5">
                      0-23 (must be after start)
                      {slotFormData.endHour && !isNaN(parseInt(slotFormData.endHour)) && (
                        <span className="ml-2 text-zinc-500">
                          = {formatTimeRange(parseInt(slotFormData.endHour), parseInt(slotFormData.endHour) + 1).split(' - ')[0]}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Preview */}
                <div className="bg-zinc-900/50 border border-zinc-800 p-4 rounded">
                  <p className="text-xs text-zinc-500 uppercase tracking-widest mb-2">Live Preview</p>
                  {slotFormData.startHour && slotFormData.endHour ? (
                    <div className="space-y-2">
                      <p className="text-lg font-mono text-white">
                        {slotFormData.timeFormat === '12h' 
                          ? formatTimeRange(parseInt(slotFormData.startHour), parseInt(slotFormData.endHour))
                          : formatTimeRange24(parseInt(slotFormData.startHour), parseInt(slotFormData.endHour))
                        }
                      </p>
                      <p className="text-xs text-zinc-500">
                        Duration: {parseInt(slotFormData.endHour) - parseInt(slotFormData.startHour)} hour(s)
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm font-mono text-zinc-500">Enter start and end times to see preview</p>
                  )}
                </div>

                {/* Price */}
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Price (€)
                  </label>
                  <div className="flex items-center">
                    <span className="text-zinc-500 mr-3 font-mono text-lg">€</span>
                    <input 
                      name="price" 
                      type="number" 
                      placeholder="60" 
                      required 
                      min="0.01"
                      max="10000"
                      step="0.01"
                      className="flex-1 bg-zinc-900 border border-zinc-700 p-3 text-white outline-none focus:border-white transition-colors font-mono text-lg" 
                    />
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1.5">Price in euros (€0.01 - €10,000)</p>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="w-full bg-white text-black px-6 py-3 font-bold uppercase text-xs tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  Add Slot
                </button>
              </form>
            </div>

            <div className="grid gap-4">
              {masterSlots.filter(s => s.gameId === selectedAdminGame).map(slot => (
                <div key={slot.id} className="bg-black border border-white/10 p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="text-xl font-bold italic mb-1">{slot.time}</div>
                    <div className="text-zinc-500 text-xs uppercase tracking-wider">{games.find(g => g.id === slot.gameId)?.name}</div>
                  </div>
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="flex items-center bg-zinc-900 border border-zinc-700 px-3 py-2 flex-1 sm:flex-none">
                      <span className="text-zinc-500 mr-2 text-sm">€</span>
                      <input type="number" value={slot.price} onChange={(e) => updatePrice(slot.id, e.target.value)} className="bg-transparent w-16 text-right font-mono focus:outline-none" />
                    </div>
                    <button onClick={() => toggleSlotStatus(slot.id)} className={`flex-1 sm:flex-none w-32 py-2 text-xs font-bold uppercase tracking-widest border ${slot.active ? 'border-white text-white' : 'border-zinc-800 text-zinc-600'}`}>{slot.active ? 'Active' : 'Disabled'}</button>
                  </div>
                </div>
              ))}
              {masterSlots.filter(s => s.gameId === selectedAdminGame).length === 0 && <p className="text-zinc-500 text-sm">No slots created for this game yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-black border border-white/10 overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-zinc-900 text-xs font-bold uppercase tracking-widest text-zinc-500">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Game</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Time</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm font-mono text-zinc-300">
                {allBookings.map(b => (
                  <tr key={b.id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-white font-bold">{b.id}</td>
                    <td className="px-6 py-4 text-zinc-400">{b.gameName}</td>
                    <td className="px-6 py-4">{b.date}</td>
                    <td className="px-6 py-4">{b.slots.join(', ')}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold uppercase tracking-widest px-2 py-1 border ${
                        b.status === 'Checked In' ? 'border-green-500 text-green-500 bg-green-500/10' : 
                        b.status === 'Cancelled' ? 'border-red-500 text-red-500 bg-red-500/10' :
                        'border-zinc-500 text-zinc-500'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {b.status === 'Confirmed' && (
                          <>
                            <button 
                              onClick={() => handleStatusChange(b.id, 'Checked In')} 
                              className="bg-white text-black p-2 hover:bg-zinc-200" 
                              title="Check In"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => handleStatusChange(b.id, 'Cancelled')} 
                              className="border border-zinc-700 text-zinc-500 p-2 hover:text-red-500 hover:border-red-500" 
                              title="Cancel Booking"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {b.status === 'Checked In' && (
                           <button className="text-green-500 cursor-default p-2"><CheckCircle size={14} /></button>
                        )}
                        {b.status === 'Cancelled' && (
                           <button 
                             onClick={() => handleDeleteBooking(b.id)}
                             className="text-red-900 hover:text-red-600 p-2"
                             title="Delete Record"
                           >
                             <Trash2 size={14} />
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {allBookings.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-zinc-600 italic">No active bookings</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'closures' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-black border border-white/10 p-6 md:p-8">
              <h3 className="text-xl font-bold uppercase italic tracking-tighter mb-6 flex items-center"><Wrench size={20} className="mr-2"/> Report Closure</h3>
              <form onSubmit={addClosure} className="space-y-6">
                 <div>
                   <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Closure Type</label>
                   <div className="flex gap-4">
                     <button type="button" onClick={() => setClosureForm({...closureForm, type: 'full'})} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border ${closureForm.type === 'full' ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-500'}`}>Full Day</button>
                     <button type="button" onClick={() => setClosureForm({...closureForm, type: 'partial'})} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest border ${closureForm.type === 'partial' ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-500'}`}>Partial</button>
                   </div>
                 </div>
                 <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Date</label><input required type="date" value={closureForm.date} onChange={e => setClosureForm({...closureForm, date: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none" /></div>
                 {closureForm.type === 'partial' && (
                   <div className="grid grid-cols-2 gap-4">
                      <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Start (24h)</label><input type="number" min="0" max="23" value={closureForm.startHour} onChange={e => setClosureForm({...closureForm, startHour: parseInt(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none" /></div>
                      <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">End (24h)</label><input type="number" min="0" max="23" value={closureForm.endHour} onChange={e => setClosureForm({...closureForm, endHour: parseInt(e.target.value)})} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none" /></div>
                   </div>
                 )}
                 <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Reason</label><select value={closureForm.reason} onChange={e => setClosureForm({...closureForm, reason: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none"><option>Maintenance</option><option>Holiday</option><option>Weather</option><option>Private Event</option><option>Other</option></select></div>
                 <div><label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Note</label><input type="text" placeholder="Optional details..." value={closureForm.note} onChange={e => setClosureForm({...closureForm, note: e.target.value})} className="w-full bg-zinc-900 border border-zinc-700 p-3 text-white outline-none" /></div>
                 <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold uppercase tracking-widest py-4 transition-colors">Activate Closure</button>
              </form>
            </div>
            <div className="bg-zinc-900/50 p-6 border border-white/5">
              <h3 className="text-sm font-bold uppercase tracking-widest mb-6">Active Closures</h3>
              <div className="space-y-4">
                 {closures.map(c => (
                   <div key={c.id} className="bg-black border border-red-900/50 p-4 flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1"><span className="text-red-500 font-bold text-sm uppercase">{c.date}</span><span className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase">{c.type}</span></div>
                        <p className="text-white font-medium text-sm">{c.reason}</p>
                        {c.type === 'partial' && <p className="text-zinc-500 text-xs mt-1">{c.startHour}:00 - {c.endHour}:00</p>}
                      </div>
                      <button onClick={() => deleteClosure(c.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={16} /></button>
                   </div>
                 ))}
                 {closures.length === 0 && <p className="text-zinc-500 italic text-sm">No active closures.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

