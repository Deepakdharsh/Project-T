'use client';

import { useState, useEffect } from 'react';
import { ChevronRight, CreditCard, Lock } from 'lucide-react';
import { 
  formatCurrency, 
  validateCard, 
  validateExpiry, 
  validateCVV, 
  validateCardholderName,
  formatCardNumber,
  formatExpiry,
  detectCardType,
  getCVVLength
} from '@/utils/validation';
import type { BookingDetails } from '@/types';

interface PaymentInterfaceProps {
  bookingDetails: BookingDetails;
  onPaymentComplete: () => void;
  onBack: () => void;
}

export const PaymentInterface = ({ bookingDetails, onPaymentComplete, onBack }: PaymentInterfaceProps) => {
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState('card');
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [formData, setFormData] = useState({
    cardName: '',
    cardNumber: '',
    expiry: '',
    cvv: ''
  });

  const cardType = detectCardType(formData.cardNumber);
  const cvvLength = getCVVLength(formData.cardNumber);

  // Real-time validation
  useEffect(() => {
    if (method === 'card' && Object.keys(touched).length > 0) {
      const newErrors: Record<string, string | null> = {};
      
      if (touched.cardNumber) {
        const cardError = validateCard(formData.cardNumber);
        if (cardError) newErrors.cardNumber = cardError;
      }
      
      if (touched.expiry) {
        const expiryError = validateExpiry(formData.expiry);
        if (expiryError) newErrors.expiry = expiryError;
      }
      
      if (touched.cvv) {
        const cvvError = validateCVV(formData.cvv, formData.cardNumber);
        if (cvvError) newErrors.cvv = cvvError;
      }
      
      if (touched.cardName) {
        const nameError = validateCardholderName(formData.cardName);
        if (nameError) newErrors.cardName = nameError;
      }
      
      setErrors(newErrors);
    }
  }, [formData, touched, method]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Auto-format inputs
    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiry') {
      formattedValue = formatExpiry(value);
    } else if (name === 'cvv') {
      // Only allow digits, limit to CVV length
      formattedValue = value.replace(/\D/g, '').substring(0, cvvLength);
    } else if (name === 'cardName') {
      // Allow letters, spaces, hyphens, apostrophes
      formattedValue = value.replace(/[^a-zA-Z\s'-]/g, '');
    }

    setFormData(prev => ({ ...prev, [name]: formattedValue }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string | null> = {};
    
    if (method === 'card') {
      const cardError = validateCard(formData.cardNumber);
      if (cardError) newErrors.cardNumber = cardError;

      const expiryError = validateExpiry(formData.expiry);
      if (expiryError) newErrors.expiry = expiryError;

      const cvvError = validateCVV(formData.cvv, formData.cardNumber);
      if (cvvError) newErrors.cvv = cvvError;

      const nameError = validateCardholderName(formData.cardName);
      if (nameError) newErrors.cardName = nameError;
    }
    
    setErrors(newErrors);
    setTouched({
      cardNumber: true,
      expiry: true,
      cvv: true,
      cardName: true
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.querySelector(`[name="${firstErrorField}"]`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (element as HTMLInputElement)?.focus();
      }
      return;
    }

    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      onPaymentComplete();
    }, 2000);
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
                onClick={() => setMethod('gpay')}
                className={`flex-1 p-4 border text-center transition-all ${method === 'gpay' ? 'bg-white border-white text-black' : 'border-zinc-700 text-zinc-400 hover:border-zinc-500'}`}
              >
                <span className="text-sm font-bold uppercase tracking-wider">Google Pay</span>
              </button>
            </div>

            {method === 'card' && (
              <div className="space-y-6">
                <div className="bg-black/30 border border-white/5 p-4 flex items-center gap-3">
                  <Lock size={16} className="text-zinc-500" />
                  <span className="text-xs text-zinc-400">Your payment information is encrypted and secure</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                    <span>Card Number</span>
                    {cardType && (
                      <span className="text-[10px] text-zinc-600 uppercase">
                        {cardType === 'visa' && 'Visa'}
                        {cardType === 'mastercard' && 'Mastercard'}
                        {cardType === 'amex' && 'American Express'}
                        {cardType === 'discover' && 'Discover'}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('cardNumber')}
                      placeholder="1234 5678 9012 3456" 
                      maxLength={19}
                      className={`w-full bg-black border p-4 text-white focus:border-white outline-none placeholder-zinc-600 appearance-none rounded-none font-mono text-lg ${errors.cardNumber ? 'border-red-500 focus:border-red-500' : touched.cardNumber && !errors.cardNumber ? 'border-green-500/50' : 'border-zinc-700'}`} 
                    />
                    {!errors.cardNumber && formData.cardNumber && (
                      <CreditCard size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  {errors.cardNumber && (
                    <span className="text-red-500 text-[10px] uppercase font-bold mt-1 block flex items-center gap-1">
                      <span>⚠</span> {errors.cardNumber}
                    </span>
                  )}
                  {touched.cardNumber && !errors.cardNumber && formData.cardNumber && (
                    <span className="text-green-500 text-[10px] uppercase font-bold mt-1 block">✓ Valid card number</span>
                  )}
                </div>

                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Expiry Date</label>
                    <input 
                      type="text" 
                      name="expiry"
                      value={formData.expiry}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('expiry')}
                      placeholder="MM/YY" 
                      maxLength={5}
                      className={`w-full bg-black border p-4 text-white focus:border-white outline-none placeholder-zinc-600 appearance-none rounded-none font-mono ${errors.expiry ? 'border-red-500 focus:border-red-500' : touched.expiry && !errors.expiry ? 'border-green-500/50' : 'border-zinc-700'}`} 
                    />
                    {errors.expiry && (
                      <span className="text-red-500 text-[10px] uppercase font-bold mt-1 block">⚠ {errors.expiry}</span>
                    )}
                    {touched.expiry && !errors.expiry && formData.expiry && (
                      <span className="text-green-500 text-[10px] uppercase font-bold mt-1 block">✓ Valid</span>
                    )}
                  </div>
                  <div className="w-1/2">
                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                      <span>CVV</span>
                      <span className="text-[10px] text-zinc-600">{cvvLength} digits</span>
                    </label>
                    <input 
                      type="text" 
                      name="cvv"
                      value={formData.cvv}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('cvv')}
                      placeholder={cardType === 'amex' ? '1234' : '123'} 
                      maxLength={cvvLength}
                      className={`w-full bg-black border p-4 text-white focus:border-white outline-none placeholder-zinc-600 appearance-none rounded-none font-mono ${errors.cvv ? 'border-red-500 focus:border-red-500' : touched.cvv && !errors.cvv ? 'border-green-500/50' : 'border-zinc-700'}`} 
                    />
                    {errors.cvv && (
                      <span className="text-red-500 text-[10px] uppercase font-bold mt-1 block">⚠ {errors.cvv}</span>
                    )}
                    {touched.cvv && !errors.cvv && formData.cvv && (
                      <span className="text-green-500 text-[10px] uppercase font-bold mt-1 block">✓ Valid</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Cardholder Name</label>
                  <input 
                    type="text" 
                    name="cardName"
                    value={formData.cardName}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('cardName')}
                    placeholder="John Doe" 
                    maxLength={50}
                    className={`w-full bg-black border p-4 text-white focus:border-white outline-none placeholder-zinc-600 appearance-none rounded-none ${errors.cardName ? 'border-red-500 focus:border-red-500' : touched.cardName && !errors.cardName ? 'border-green-500/50' : 'border-zinc-700'}`} 
                  />
                  {errors.cardName && (
                    <span className="text-red-500 text-[10px] uppercase font-bold mt-1 block">⚠ {errors.cardName}</span>
                  )}
                  {touched.cardName && !errors.cardName && formData.cardName && (
                    <span className="text-green-500 text-[10px] uppercase font-bold mt-1 block">✓ Valid</span>
                  )}
                </div>
              </div>
            )}

            {method === 'gpay' && (
              <div className="bg-black border border-zinc-700 p-8 text-center animate-fade-in">
                 <div className="flex flex-col items-center justify-center mb-6">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3">
                       <span className="text-black font-black text-2xl tracking-tighter">G</span>
                    </div>
                    <p className="text-zinc-400 text-sm">Pay via Google Pay</p>
                 </div>
                 <input 
                   type="text" 
                   placeholder="Enter UPI ID (e.g. name@oksbi)" 
                   className="w-full bg-zinc-900 border border-zinc-700 p-4 text-white outline-none placeholder-zinc-600 appearance-none rounded-none text-center font-mono" 
                 />
                 <p className="text-zinc-600 text-xs mt-4 uppercase tracking-widest">Or scan QR code at the venue</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={processing}
              className="w-full bg-white text-black py-5 text-sm font-bold uppercase tracking-widest hover:bg-zinc-200 transition-colors mt-8"
            >
              {processing ? 'Processing...' : `Pay ${formatCurrency(bookingDetails.total)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

