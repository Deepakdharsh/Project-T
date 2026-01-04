import type { Request, Response } from 'express';
import { createClosure, deleteClosure, listAllClosures } from '../services/closureService.js';

export async function getClosures(_req: Request, res: Response) {
  return res.json({ closures: await listAllClosures() });
}

export async function postClosure(req: Request, res: Response) {
  const closure = await createClosure(req.body as any);
  return res.status(201).json({ closure });
}

export async function removeClosure(req: Request, res: Response) {
  const { closureId } = req.params as any;
  await deleteClosure(closureId);
  return res.status(204).send();
}


