import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export type ScanTokenPayload = {
  bid: string; // bookingId e.g. BK-1234
  typ: 'booking-scan';
};

const secret = env.QR_SCAN_SECRET || env.JWT_ACCESS_SECRET;

export function signBookingScanToken(bookingId: string) {
  const payload: ScanTokenPayload = { bid: bookingId, typ: 'booking-scan' };
  const opts: SignOptions = { expiresIn: env.QR_SCAN_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, secret, opts);
}

export function verifyBookingScanToken(token: string): ScanTokenPayload {
  const payload = jwt.verify(token, secret) as ScanTokenPayload;
  if (payload.typ !== 'booking-scan' || !payload.bid) {
    throw new Error('Invalid token type');
  }
  return payload;
}


