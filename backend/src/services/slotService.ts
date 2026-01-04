import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError.js';
import { SlotModel } from '../models/Slot.js';
import { GameModel } from '../models/Game.js';
import { BookingModel } from '../models/Booking.js';
import { formatTimeRange } from '../utils/timeLabel.js';

export async function createSlot(input: {
  gameId: string;
  startHour: number;
  endHour: number;
  price: number;
  active: boolean;
}) {
  const game = await GameModel.findById(input.gameId).lean();
  if (!game) throw new ApiError(404, 'Game not found');
  if (input.startHour >= input.endHour) throw new ApiError(400, 'End time must be after start time');

  const timeLabel = formatTimeRange(input.startHour, input.endHour);
  const slot = await SlotModel.create({
    gameId: input.gameId,
    startHour: input.startHour,
    endHour: input.endHour,
    timeLabel,
    price: input.price,
    active: input.active,
  });

  return toSlotResponse(slot);
}

export async function updateSlot(slotId: string, patch: { price?: number; active?: boolean }) {
  const slot = await SlotModel.findById(slotId);
  if (!slot) throw new ApiError(404, 'Slot not found');

  if (typeof patch.price === 'number') slot.price = patch.price;
  if (typeof patch.active === 'boolean') slot.active = patch.active;

  await slot.save();
  return toSlotResponse(slot);
}

export async function deleteSlot(slotId: string) {
  const slot = await SlotModel.findById(slotId).lean();
  if (!slot) return;

  const inUse = await BookingModel.exists({
    status: { $ne: 'Cancelled' },
    slotIds: new mongoose.Types.ObjectId(slotId),
  });
  if (inUse) throw new ApiError(409, 'Slot has active bookings; cancel bookings first');

  await SlotModel.deleteOne({ _id: slotId });
}

export async function removeAllSlotsForGame(gameId: string) {
  const activeBookings = await BookingModel.exists({ gameId, status: { $ne: 'Cancelled' } });
  if (activeBookings) throw new ApiError(409, 'Game has active bookings; cancel them first');
  const result = await SlotModel.deleteMany({ gameId });
  return { deletedCount: result.deletedCount ?? 0 };
}

export async function generateSlots(input: {
  gameId: string;
  openHour: number;
  closeHour: number;
  durationMins: 60 | 120;
  dayPrice: number;
  peakPrice: number;
  peakStartHour: number;
  replaceExisting: boolean;
}) {
  if (input.openHour >= input.closeHour) throw new ApiError(400, 'Open time must be before close time');
  const stepHours = input.durationMins / 60;

  const activeBookings = input.replaceExisting
    ? await BookingModel.exists({ gameId: input.gameId, status: { $ne: 'Cancelled' } })
    : null;
  if (activeBookings) throw new ApiError(409, 'Game has active bookings; cannot replace slots');

  if (input.replaceExisting) {
    await SlotModel.deleteMany({ gameId: input.gameId });
  }

  const existing = await SlotModel.find({ gameId: input.gameId }).select({ startHour: 1 }).lean();
  const existingStarts = new Set(existing.map((s: any) => s.startHour));

  const toCreate: any[] = [];
  for (let h = input.openHour; h + stepHours <= input.closeHour; h += stepHours) {
    const startHour = h;
    const endHour = h + stepHours;
    if (!input.replaceExisting && existingStarts.has(startHour)) continue;
    const price = startHour >= input.peakStartHour ? input.peakPrice : input.dayPrice;
    toCreate.push({
      gameId: input.gameId,
      startHour,
      endHour,
      timeLabel: formatTimeRange(startHour, endHour),
      price,
      active: true,
    });
  }

  if (toCreate.length === 0) throw new ApiError(400, 'No slots generated');

  const inserted = await SlotModel.insertMany(toCreate, { ordered: false });
  return inserted.map(toSlotResponse);
}

function toSlotResponse(s: any) {
  return {
    id: s._id.toString(),
    gameId: s.gameId.toString(),
    time: s.timeLabel,
    startHour: s.startHour,
    endHour: s.endHour,
    price: s.price,
    active: s.active,
  };
}


