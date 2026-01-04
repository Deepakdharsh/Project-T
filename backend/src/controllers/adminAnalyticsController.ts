import type { Request, Response } from 'express';
import { getAnalytics } from '../services/analyticsService.js';

export async function getAdminAnalytics(req: Request, res: Response) {
  const { from, to } = req.query as any;
  const analytics = await getAnalytics({ from, to });
  return res.json({ analytics });
}


