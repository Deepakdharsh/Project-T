import type { Request, Response } from 'express';
import {
  createCategory,
  createGame,
  deleteCategory,
  deleteGame,
  listCategories,
  listGames,
  updateCategory,
  updateGame,
} from '../services/adminCatalogService.js';

export async function getCategories(_req: Request, res: Response) {
  const categories = await listCategories();
  return res.json({ categories });
}

export async function postCategory(req: Request, res: Response) {
  const { name } = req.body as any;
  const category = await createCategory({ name });
  return res.status(201).json({ category });
}

export async function patchCategory(req: Request, res: Response) {
  const { categoryId } = req.params as any;
  const { name } = req.body as any;
  const category = await updateCategory(categoryId, { name });
  return res.json({ category });
}

export async function removeCategory(req: Request, res: Response) {
  const { categoryId } = req.params as any;
  await deleteCategory(categoryId);
  return res.status(204).send();
}

export async function getGames(_req: Request, res: Response) {
  const games = await listGames();
  return res.json({ games });
}

export async function postGame(req: Request, res: Response) {
  const { categoryId, name } = req.body as any;
  const game = await createGame({ categoryId, name });
  return res.status(201).json({ game });
}

export async function patchGame(req: Request, res: Response) {
  const { gameId } = req.params as any;
  const { categoryId, name } = req.body as any;
  const game = await updateGame(gameId, { categoryId, name });
  return res.json({ game });
}

export async function removeGame(req: Request, res: Response) {
  const { gameId } = req.params as any;
  await deleteGame(gameId);
  return res.status(204).send();
}


