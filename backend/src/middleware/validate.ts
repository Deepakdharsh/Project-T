import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
    return (req: Request, _res: Response, next: NextFunction) => {
        // parse() throws; errorHandler maps ZodError → 400
        schema.parse({
            body: req.body,
            query: req.query,
            params: req.params,
            headers: req.headers,
        });
        next();
    };
}


