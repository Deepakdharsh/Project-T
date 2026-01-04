import type { Request, Response } from 'express';
import { verifyAndConsumeScan } from '../services/scanService.js';

export async function postVerifyScan(req: Request, res: Response) {
  const { token } = req.body as any;
  const result = await verifyAndConsumeScan({
    token,
    adminUserId: req.auth!.userId,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  return res.json(result);
}


