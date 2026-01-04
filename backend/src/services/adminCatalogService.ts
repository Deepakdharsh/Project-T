import { ApiError } from '../utils/apiError.js';
import { CategoryModel } from '../models/Category.js';
import { GameModel } from '../models/Game.js';
import { SlotModel } from '../models/Slot.js';
import { BookingModel } from '../models/Booking.js';

export async function listCategories() {
  const categories = await CategoryModel.find().sort({ name: 1 }).lean();
  return categories.map((c) => ({ id: c._id.toString(), name: c.name }));
}

export async function createCategory(input: { name: string }) {
  const created = await CategoryModel.create({ name: input.name.trim() });
  return { id: created._id.toString(), name: created.name };
}

export async function updateCategory(categoryId: string, patch: { name?: string }) {
  const category = await CategoryModel.findById(categoryId);
  if (!category) throw new ApiError(404, 'Category not found');
  if (typeof patch.name === 'string') category.name = patch.name.trim();
  await category.save();
  return { id: category._id.toString(), name: category.name };
}

export async function deleteCategory(categoryId: string) {
  const category = await CategoryModel.findById(categoryId).lean();
  if (!category) return;

  const hasGames = await GameModel.exists({ categoryId });
  if (hasGames) throw new ApiError(409, 'Category has games; delete games first');

  await CategoryModel.deleteOne({ _id: categoryId });
}

export async function listGames() {
  const games = await GameModel.find().sort({ name: 1 }).lean();
  return games.map((g) => ({
    id: g._id.toString(),
    categoryId: g.categoryId.toString(),
    name: g.name,
  }));
}

export async function createGame(input: { categoryId: string; name: string }) {
  const category = await CategoryModel.findById(input.categoryId).lean();
  if (!category) throw new ApiError(404, 'Category not found');
  const created = await GameModel.create({ categoryId: input.categoryId, name: input.name.trim() });
  return { id: created._id.toString(), categoryId: created.categoryId.toString(), name: created.name };
}

export async function updateGame(gameId: string, patch: { categoryId?: string; name?: string }) {
  const game = await GameModel.findById(gameId);
  if (!game) throw new ApiError(404, 'Game not found');

  if (typeof patch.categoryId === 'string') {
    const category = await CategoryModel.findById(patch.categoryId).lean();
    if (!category) throw new ApiError(404, 'Category not found');
    game.categoryId = patch.categoryId as any;
  }
  if (typeof patch.name === 'string') game.name = patch.name.trim();

  await game.save();
  return { id: game._id.toString(), categoryId: game.categoryId.toString(), name: game.name };
}

export async function deleteGame(gameId: string) {
  const game = await GameModel.findById(gameId).lean();
  if (!game) return;

  const hasSlots = await SlotModel.exists({ gameId });
  if (hasSlots) throw new ApiError(409, 'Game has slots; delete slots first');

  const hasBookings = await BookingModel.exists({ gameId, status: { $ne: 'Cancelled' } });
  if (hasBookings) throw new ApiError(409, 'Game has active bookings; cancel bookings first');

  await GameModel.deleteOne({ _id: gameId });
}


