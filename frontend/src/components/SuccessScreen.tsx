'use client';

import { Star, Check, Copy } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import type { Booking } from '@/types';

interface SuccessScreenProps {
  bookingDetails: Booking;
  onHome: () => void;
  onToast: (notification: any) => void;
}

export const SuccessScreen = ({ bookingDetails, onHome, onToast }: SuccessScreenProps) => {
  const scanToken = bookingDetails.scanToken || bookingDetails.id;

  const handleCopy = () => {
    const textArea = document.createElement("textarea");
    textArea.value = bookingDetails.id;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      document.execCommand('copy');
      onToast({ type: 'info', title: 'Copied', message: 'Booking ID copied to clipboard.' });
    } catch (err) {
      console.error('Copy failed', err);
    }

    document.body.removeChild(textArea);
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 md:p-6 text-center">
      <div className="mb-6 md:mb-8 animate-pulse">
        <Star size={40} className="text-white fill-white" />
      </div>
      <h1 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter mb-4">You&apos;re In.</h1>
      <p className="text-zinc-400 max-w-md mb-8 md:mb-12 text-base md:text-lg">
        Your booking is confirmed. Show the QR code below at the reception for entry.
      </p>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-stretch w-full max-w-4xl justify-center">

        <div className="bg-white p-6 md:p-8 flex flex-col items-center justify-center text-black w-full md:w-auto order-1 md:order-1">
          <div className="bg-white p-2 border-2 border-black mb-4 w-full md:w-auto flex justify-center">
            <QRCodeCanvas
              value={scanToken}
              size={192}
              includeMargin
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <span className="text-xs font-bold uppercase tracking-widest mb-2">Order ID</span>
          <div className="flex items-center gap-2 bg-gray-100 px-3 py-1 rounded cursor-pointer hover:bg-gray-200" onClick={handleCopy}>
            <span className="text-lg font-black tracking-tight">{bookingDetails.id}</span>
            <Copy size={14} className="text-gray-500" />
          </div>
          {!bookingDetails.scanToken && (
            <div className="text-[10px] uppercase tracking-widest text-gray-500 mt-3">
              (Fallback QR: booking code)
            </div>
          )}
        </div>

        <div className="border border-white/20 p-6 md:p-8 flex-1 text-left bg-zinc-900/30 flex flex-col justify-center order-2 md:order-2">
          <div className="grid grid-cols-1 gap-6 text-sm">
            <div>
              <span className="block text-zinc-500 uppercase tracking-wider text-xs mb-1">Game</span>
              <span className="font-mono text-lg md:text-xl">{bookingDetails.gameName || 'Standard Pitch'}</span>
            </div>
            <div>
              <span className="block text-zinc-500 uppercase tracking-wider text-xs mb-1">Date</span>
              <span className="font-mono text-lg md:text-xl">{bookingDetails.date}</span>
            </div>
            <div>
              <span className="block text-zinc-500 uppercase tracking-wider text-xs mb-1">Time Slots</span>
              {bookingDetails.slots.map((s, idx) => (
                <div key={idx} className="font-mono text-lg md:text-xl">{s}</div>
              ))}
            </div>
            <div className="pt-4 border-t border-white/10">
              <span className="block text-zinc-500 uppercase tracking-wider text-xs mb-1">Status</span>
              <span className="inline-flex items-center px-2 py-1 bg-green-900/30 text-green-500 text-xs font-bold uppercase tracking-widest border border-green-900">
                <Check size={12} className="mr-1" /> Confirmed
              </span>
            </div>
          </div>
        </div>
      </div>

      <button onClick={onHome} className="mt-12 text-sm font-bold uppercase tracking-widest border-b border-white pb-1 hover:text-zinc-400 hover:border-zinc-400 transition-all p-2">
        Return Home
      </button>
    </div>
  );
};

