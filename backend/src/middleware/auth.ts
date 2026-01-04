import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError.js';
import { verifyAccessToken } from '../utils/jwt.js';

export interface AuthContext {
  userId: string;
  role: 'user' | 'admin';
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) throw new ApiError(401, 'Missing Authorization Bearer token');

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyAccessToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
  next();
}


