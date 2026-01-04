import type { Request, Response } from 'express';
import { listCategories, listClosures, listGames, listSlots } from '../services/catalogService.js';

export async function getCategories(_req: Request, res: Response) {
  return res.json({ categories: await listCategories() });
}

export async function getGames(req: Request, res: Response) {
  const categoryId = req.query.categoryId as string | undefined;
  return res.json({ games: await listGames({ categoryId }) });
}

export async function getSlots(req: Request, res: Response) {
  const gameId = req.query.gameId as string | undefined;
  const activeRaw = req.query.active as string | undefined;
  const active = activeRaw === undefined ? undefined : activeRaw === 'true';
  return res.json({ slots: await listSlots({ gameId, active }) });
}

export async function getClosures(req: Request, res: Response) {
  const date = req.query.date as string | undefined;
  return res.json({ closures: await listClosures({ date }) });
}


