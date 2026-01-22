import rateLimit from 'express-rate-limit';
import type { Request, Response } from 'express';
import { env } from '../config/env.js';

function rateLimitJsonHandler(_req: Request, res: Response) {
  return res.status(429).json({
    error: {
      message: 'Too many requests. Please try again later.',
    },
  });
}

export const apiRateLimit = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
});

export const authRateLimit = rateLimit({
  windowMs: 60_000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
});

// Public payment endpoints are attractive targets; keep limits stricter than general API.
export const paymentRateLimit = rateLimit({
  windowMs: 60_000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
  keyGenerator: (req) => req.ip || 'ip:unknown',
});

// User/booking keyed limiter to pair with IP limiter for payment endpoints.
export const paymentUserRateLimit = rateLimit({
  windowMs: 60_000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
  keyGenerator: (req) => {
    const email = (req as any)?.body?.guest?.email;
    if (typeof email === 'string' && email.trim()) return `email:${email.trim().toLowerCase()}`;
    const bookingId = (req as any)?.body?.bookingId;
    if (typeof bookingId === 'string' && bookingId.trim()) return `booking:${bookingId.trim()}`;
    return req.ip || 'ip:unknown';
  },
});


