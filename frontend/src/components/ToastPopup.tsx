'use client';

import { CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

interface Notification {
  type: 'success' | 'info' | 'error';
  title: string;
  message: string;
  details?: {
    game?: string;
    user?: string;
    id?: string;
    slots?: string;
  };
}

interface ToastPopupProps {
  notification: Notification | null;
  onClose: () => void;
}

export const ToastPopup = ({ notification, onClose }: ToastPopupProps) => {
  if (!notification) return null;

  return (
    <div className={`fixed top-4 right-4 md:top-8 md:right-8 z-[100] max-w-sm w-full p-4 rounded shadow-2xl border-l-4 bg-white text-black transition-all transform duration-300 animate-slide-in-right ${
      notification.type === 'success' ? 'border-green-500' : 
      notification.type === 'info' ? 'border-blue-500' : 'border-red-500'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`mt-1 p-1 rounded-full ${
          notification.type === 'success' ? 'bg-green-100 text-green-600' : 
          notification.type === 'info' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'
        }`}>
          {notification.type === 'success' ? <CheckCircle size={20} /> : notification.type === 'info' ? <Info size={20} /> : <AlertTriangle size={20} />}
        </div>
        <div className="flex-1">
          <h4 className={`font-bold uppercase tracking-wider text-sm mb-1 ${
            notification.type === 'success' ? 'text-green-700' : 
            notification.type === 'info' ? 'text-blue-700' : 'text-red-700'
          }`}>{notification.title}</h4>
          <p className="text-zinc-600 text-sm mb-2">{notification.message}</p>
          {notification.details && (
            <div className="bg-zinc-50 p-2 rounded border border-zinc-100 text-xs space-y-1">
               {notification.details.game && <div className="flex justify-between"><span className="text-zinc-500 uppercase tracking-widest text-[10px]">Game</span> <span className="font-bold">{notification.details.game}</span></div>}
               {notification.details.user && <div className="flex justify-between"><span className="text-zinc-500 uppercase tracking-widest text-[10px]">User</span> <span className="font-bold">{notification.details.user}</span></div>}
               <div className="flex justify-between"><span className="text-zinc-500 uppercase tracking-widest text-[10px]">Order</span> <span className="font-mono">{notification.details.id}</span></div>
               {notification.details.slots && <div className="flex justify-between"><span className="text-zinc-500 uppercase tracking-widest text-[10px]">Slots</span> <span className="font-medium">{notification.details.slots}</span></div>}
            </div>
          )}
        </div>
        <button onClick={onClose}><X size={16} className="text-zinc-400 hover:text-black" /></button>
      </div>
    </div>
  );
};

