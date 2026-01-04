import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: {
                message: 'Validation error',
                issues: err.issues,
            },
        });
    }

    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            error: {
                message: err.message,
                details: err.details,
            },
        });
    }

    // Mongoose duplicate key
  if (typeof err === 'object' && err && 'code' in err && (err as Record<string, unknown>).code === 11000) {
        return res.status(409).json({
            error: {
                message: 'Duplicate key',
        details: (err as any).keyValue,
            },
        });
    }

    console.error(err);
    return res.status(500).json({
        error: { message: 'Internal server error' },
    });
}


