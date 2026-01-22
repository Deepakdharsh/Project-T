import crypto from 'crypto';
import { env } from '../config/env.js';

export function verifyRazorpaySignature(input: { orderId: string; paymentId: string; signature: string }) {
  // Razorpay signature is HMAC_SHA256(orderId|paymentId, key_secret)
  const secret = env.RAZORPAY_KEY_SECRET || '';
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest('hex');
  return timingSafeEqualHex(expected, input.signature);
}

function timingSafeEqualHex(a: string, b: string) {
  try {
    const ab = Buffer.from(a, 'hex');
    const bb = Buffer.from(b, 'hex');
    if (ab.length !== bb.length) return false;
    return crypto.timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}



