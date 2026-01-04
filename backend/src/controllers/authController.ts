import type { Request, Response } from 'express';
import { registerUser, loginUser } from '../services/authService.js';
import { issueRefreshSession, revokeRefreshSession, rotateRefreshSession } from '../services/refreshAuthService.js';
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from '../utils/cookies.js';

export async function register(req: Request, res: Response) {
  const { email, name, password } = req.body as any;
  const result = await registerUser({ email, name, password });
  return res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body as any;
  const result = await loginUser({ email, password });
  const refreshToken = await issueRefreshSession(result.user.id);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  return res.json({ user: result.user, accessToken: result.accessToken });
}

export async function refresh(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) return res.status(401).json({ error: { message: 'Missing refresh token' } });

  const rotated = await rotateRefreshSession(token);
  res.cookie(REFRESH_COOKIE_NAME, rotated.refreshToken, refreshCookieOptions());
  return res.json({ user: rotated.user, accessToken: rotated.accessToken });
}

export async function logout(req: Request, res: Response) {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (token) await revokeRefreshSession(token);
  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  return res.status(204).send();
}


