import mongoose from 'mongoose';
import { ApiError } from '../utils/apiError.js';
import { BookingModel } from '../models/Booking.js';
import { SlotModel } from '../models/Slot.js';
import { GameModel } from '../models/Game.js';
import { ClosureModel } from '../models/Closure.js';
import { generateBookingId } from '../utils/bookingId.js';
import { signBookingScanToken } from '../utils/scanToken.js';

export async function createBooking(input: {
  date: string;
  gameId: string;
  slotIds: string[];
  userId?: string;
  guest?: { name: string; email?: string };
}) {
  const game = await GameModel.findById(input.gameId).lean();
  if (!game) throw new ApiError(404, 'Game not found');

  const slotObjectIds = input.slotIds.map(id => new mongoose.Types.ObjectId(id));
  const slots = await SlotModel.find({ _id: { $in: slotObjectIds }, gameId: input.gameId }).lean();
  if (slots.length !== input.slotIds.length) throw new ApiError(400, 'One or more slots are invalid for this game');
  if (slots.some((s: any) => !s.active)) throw new ApiError(400, 'One or more selected slots are disabled');

  // Closure checks (same logic as UI)
  const closure = await ClosureModel.findOne({ date: input.date }).lean();
  if (closure?.type === 'full') throw new ApiError(409, `Turf is closed: ${closure.reason}`);
  if (closure?.type === 'partial') {
    const start = closure.startHour ?? 0;
    const end = closure.endHour ?? 24;
    const blocked = slots.find((s: any) => s.startHour >= start && s.startHour < end);
    if (blocked) throw new ApiError(409, `Selected slot overlaps closure: ${closure.reason}`);
  }

  // Booking collision: any active booking for same date/game sharing a slot
  const conflict = await BookingModel.findOne({
    date: input.date,
    gameId: input.gameId,
    status: { $ne: 'Cancelled' },
    slotIds: { $in: slotObjectIds },
  }).lean();

  if (conflict) throw new ApiError(409, 'One or more selected slots are already booked');

  const totalPrice = slots.reduce((sum: number, s: any) => sum + s.price, 0);
  const bookingId = await generateBookingId();

  const booking = await BookingModel.create({
    bookingId,
    date: input.date,
    gameId: input.gameId,
    slotIds: slots.map((s: any) => s._id),
    slotTimes: slots.map((s: any) => s.timeLabel),
    totalPrice,
    status: 'Confirmed',
    userId: input.userId,
    guestName: input.guest?.name ?? 'Guest User',
    guestEmail: input.guest?.email,
    checkedInAt: null,
  });

  return toBookingResponse(booking, game.name);
}

export async function getBooking(bookingId: string) {
  const booking = await BookingModel.findOne({ bookingId }).lean();
  if (!booking) throw new ApiError(404, 'Booking not found');
  const game = await GameModel.findById(booking.gameId).lean();
  return toBookingResponse(booking, game?.name);
}

function toBookingResponse(b: any, gameName?: string) {
  return {
    id: b.bookingId,
    date: b.date,
    slots: b.slotTimes,
    totalPrice: b.totalPrice,
    gameId: b.gameId.toString(),
    gameName: gameName ?? '',
    status: b.status,
    user: b.guestName ?? 'Guest User',
    checkedInAt: b.checkedInAt ? new Date(b.checkedInAt).toISOString() : null,
    scanToken: signBookingScanToken(b.bookingId),
  };
}


