import type { CookieOptions } from 'express';
import { env } from '../config/env.js';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export function refreshCookieOptions(): CookieOptions {
  const isProd = env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/v1/auth',
  };
}


