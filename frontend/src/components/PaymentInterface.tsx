'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, CreditCard, Lock } from 'lucide-react';
import { formatCurrency } from '@/utils/validation';
import type { Booking, BookingDetails } from '@/types';
import { api, getApiConfig } from '@/lib/api';

interface PaymentInterfaceProps {
  bookingDetails: BookingDetails;
  onPaymentVerified: (booking: Booking) => void;
  onBack: () => void;
}

type RazorpayCheckoutResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: any;
  }
}

export const PaymentInterface = ({ bookingDetails, onPaymentVerified, onBack }: PaymentInterfaceProps) => {
  const { baseUrl } = getApiConfig();
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState<'card' | 'upi'>('card');
  const [guestName, setGuestName] = useState('Guest User');
  const [guestEmail, setGuestEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [serverBookingId, setServerBookingId] = useState<string | null>(null);

  const canPay = useMemo(() => {
    if (!guestName.trim()) return false;
    if (!guestEmail.trim()) return false;
    return true;
  }, [guestName, guestEmail]);

  useEffect(() => {
    // Preload Razorpay script (best effort)
    void loadRazorpayScript();
  }, []);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (processing) return;
    setError(null);
    if (!canPay) {
      setError('Please enter your name and a valid email.');
      return;
    }

    setProcessing(true);
    try {
      const orderRes = await api.payments.createOrder(
        baseUrl,
        serverBookingId
          ? { bookingId: serverBookingId }
          : {
              date: bookingDetails.date,
              gameId: bookingDetails.gameId,
              slotIds: bookingDetails.slots.map((s) => s.id),
              guest: { name: guestName.trim(), email: guestEmail.trim().toLowerCase() },
            }
      );

      if (!orderRes.razorpay.keyId) throw new Error('Razorpay key is not configured on server');
      if (!serverBookingId) setServerBookingId(orderRes.booking.id);
      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error('Razorpay Checkout failed to load');

      const options = {
        key: orderRes.razorpay.keyId,
        amount: orderRes.razorpay.amount,
        currency: orderRes.razorpay.currency,
        name: 'Turf Booking',
        description: `${bookingDetails.gameName} • ${bookingDetails.date}`,
        order_id: orderRes.razorpay.orderId,
        prefill: { name: guestName.trim(), email: guestEmail.trim().toLowerCase() },
        method: { upi: true, card: true },
        config: {
          display: {
            preferences: { show_default_blocks: true },
          },
        },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
        handler: async (resp: RazorpayCheckoutResponse) => {
          try {
            const verifyRes = await api.payments.verify(baseUrl, {
              bookingId: orderRes.booking.id,
              orderId: resp.razorpay_order_id,
              paymentId: resp.razorpay_payment_id,
              signature: resp.razorpay_signature,
            });
            onPaymentVerified(verifyRes.booking);
          } catch (err: any) {
            setError(err?.message || 'Payment verification failed.');
            setProcessing(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      // Hint Razorpay to focus a method (still allows both).
      if (method === 'upi') {
        try {
          rzp.update({ method: { upi: true } });
        } catch {
          // ignore
        }
      }
    } catch (err: any) {
      setError(err?.message || 'Unable to start payment.');
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white pt-28 pb-12 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        <button onClick={onBack} className="text-zinc-500 hover:text-white flex items-center mb-8 text-xs font-bold uppercase tracking-widest transition-colors py-2">
          <ChevronRight className="rotate-180 mr-2 w-4 h-4" /> Change Selection
        </button>

        <div className="border border-white/10 bg-zinc-900/50 p-6 md:p-12">
          <div className="flex flex-col md:flex-row justify-between items-start mb-8 md:mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Checkout</h2>
              <p className="text-zinc-400 text-sm">Secure your slot for {bookingDetails.gameName}.</p>
            </div>
            <div className="text-left md:text-right w-full md:w-auto p-4 bg-black/50 md:bg-transparent border border-white/10 md:border-none">
              <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">Total Due</p>
              <p className="text-2xl md:text-3xl font-black text-white">{formatCurrency(bookingDetails.total)}</p>
            </div>
          </div>

          <form onSubmit={handlePay} className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                type="button"
                onClick={() => setMethod('card')}
                className={`flex-1 p-4 border text-center transition-all ${method === 'card' ? 'bg-white border-white text-black' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
              >
                <span className="text-sm font-bold uppercase tracking-wider">Card</span>
              </button>
              <button 
                type="button"
                onClick={() => setMethod('upi')}
                className={`flex-1 p-4 border text-center transition-all ${method === 'upi' ? 'bg-white border-white text-black' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
              >
                <span className="text-sm font-bold uppercase tracking-wider">UPI</span>
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-black/30 border border-white/5 p-4 flex items-center gap-3">
                <Lock size={16} className="text-zinc-500" />
                <span className="text-xs text-zinc-400">
                  Payments are processed securely by Razorpay. We never collect card/UPI details on this site.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Name</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your name"
                    maxLength={80}
                    className="w-full bg-black border border-zinc-700 p-4 text-white focus:border-white outline-none placeholder-zinc-600 appearance-none rounded-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Email</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-black border border-zinc-700 p-4 text-white focus:border-white outline-none placeholder-zinc-600 appearance-none rounded-none"
                  />
                  <p className="text-[10px] text-zinc-600 mt-1.5">We’ll send your confirmation to this email.</p>
                </div>
              </div>

              {method === 'card' && (
                <div className="bg-black border border-zinc-700 p-6 flex items-center gap-4">
                  <CreditCard size={18} className="text-zinc-400" />
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest">Pay by Card</p>
                    <p className="text-xs text-zinc-500 mt-1">Visa, Mastercard, RuPay and more via Razorpay Checkout.</p>
                  </div>
                </div>
              )}

              {method === 'upi' && (
                <div className="bg-black border border-zinc-700 p-6">
                  <p className="text-sm font-bold uppercase tracking-widest">Pay by UPI</p>
                  <p className="text-xs text-zinc-500 mt-1">Pay using UPI apps via Razorpay Checkout.</p>
                </div>
              )}

              {error && (
                <div className="bg-red-950/20 border border-red-900 p-4 text-xs text-red-300">
                  {error}
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={processing || !canPay}
              className="w-full bg-white text-black py-5 text-sm font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors mt-8"
            >
              {processing ? 'Opening Razorpay…' : `Pay ${formatCurrency(bookingDetails.total)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

async function loadRazorpayScript() {
  if (typeof window === 'undefined') return;
  if (window.Razorpay) return;

  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay="checkout"]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Razorpay Checkout')));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.setAttribute('data-razorpay', 'checkout');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay Checkout'));
    document.body.appendChild(script);
  });
}

