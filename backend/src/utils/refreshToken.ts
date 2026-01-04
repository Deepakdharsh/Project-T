import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';

export type RefreshTokenPayload = {
  sub: string; // user id
  typ: 'refresh';
};

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function signRefreshToken(userId: string) {
  const payload: RefreshTokenPayload = { sub: userId, typ: 'refresh' };
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, opts);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const payload = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  if (payload.typ !== 'refresh') throw new Error('Invalid token type');
  return payload;
}


