import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type { Request, Response } from 'express';
import cookieParser from 'cookie-parser';

import { corsOrigins } from './config/env.js';
import { apiRateLimit } from './middleware/rateLimit.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { routes } from './routes/index.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    })
  );
  app.use(apiRateLimit);
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req: Request, res: Response) => res.json({ ok: true }));
  app.use('/api/v1', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}


