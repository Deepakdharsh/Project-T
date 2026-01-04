import { CategoryModel } from '../models/Category.js';
import { GameModel } from '../models/Game.js';
import { SlotModel } from '../models/Slot.js';
import { ClosureModel } from '../models/Closure.js';

export async function listCategories() {
  const items = await CategoryModel.find().sort({ name: 1 }).lean();
  return items.map((c: any) => ({ id: c._id.toString(), name: c.name }));
}

export async function listGames(filter: { categoryId?: string }) {
  const q: any = {};
  if (filter.categoryId) q.categoryId = filter.categoryId;
  const items = await GameModel.find(q).sort({ name: 1 }).lean();
  return items.map((g: any) => ({ id: g._id.toString(), categoryId: g.categoryId.toString(), name: g.name }));
}

export async function listSlots(filter: { gameId?: string; active?: boolean }) {
  const q: any = {};
  if (filter.gameId) q.gameId = filter.gameId;
  if (typeof filter.active === 'boolean') q.active = filter.active;
  const items = await SlotModel.find(q).sort({ startHour: 1 }).lean();
  return items.map((s: any) => ({
    id: s._id.toString(),
    gameId: s.gameId.toString(),
    time: s.timeLabel,
    startHour: s.startHour,
    endHour: s.endHour,
    price: s.price,
    active: s.active,
  }));
}

export async function listClosures(filter: { date?: string }) {
  const q: any = {};
  if (filter.date) q.date = filter.date;
  const items = await ClosureModel.find(q).sort({ date: 1, startHour: 1 }).lean();
  return items.map((c: any) => ({
    id: c._id.toString(),
    type: c.type,
    date: c.date,
    startHour: c.startHour,
    endHour: c.endHour,
    reason: c.reason,
    note: c.note,
  }));
}


