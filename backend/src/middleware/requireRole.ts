import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError.js';
import type { UserRole } from '../models/User.js';

export function requireRole(role: UserRole) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) throw new ApiError(401, 'Not authenticated');
    if (req.auth.role !== role) throw new ApiError(403, 'Forbidden');
    next();
  };
}


