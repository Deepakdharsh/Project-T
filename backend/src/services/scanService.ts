import jwt from 'jsonwebtoken';
import { BookingModel } from '../models/Booking.js';
import { SlotModel } from '../models/Slot.js';
import { ScanEventModel, type ScanResult } from '../models/ScanEvent.js';
import { GameModel } from '../models/Game.js';
import { verifyBookingScanToken } from '../utils/scanToken.js';

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function isNowWithinAnySlot(slots: Array<{ startHour: number; endHour: number }>) {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return slots.some((s) => {
    const start = s.startHour * 60;
    const end = s.endHour * 60;
    return nowMinutes >= start && nowMinutes < end;
  });
}

export async function verifyAndConsumeScan(input: {
  token: string;
  adminUserId: string;
  ip?: string;
  userAgent?: string;
}) {
  let bookingCode: string | undefined;
  let bookingDoc: any = null;
  let result: ScanResult = 'INVALID';

  try {
    const payload = verifyBookingScanToken(input.token);
    bookingCode = payload.bid;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) result = 'EXPIRED';
    await ScanEventModel.create({
      bookingCode,
      adminId: input.adminUserId,
      result,
      scannedAt: new Date(),
      ip: input.ip,
      userAgent: input.userAgent,
    });
    return { status: result };
  }

  bookingDoc = await BookingModel.findOne({ bookingId: bookingCode });
  if (!bookingDoc) {
    await ScanEventModel.create({
      bookingCode,
      adminId: input.adminUserId,
      result: 'INVALID',
      scannedAt: new Date(),
      ip: input.ip,
      userAgent: input.userAgent,
    });
    return { status: 'INVALID' as const };
  }

  // Already used
  if (bookingDoc.status === 'Checked In') {
    await ScanEventModel.create({
      bookingId: bookingDoc._id,
      bookingCode,
      adminId: input.adminUserId,
      result: 'ALREADY_USED',
      scannedAt: new Date(),
      ip: input.ip,
      userAgent: input.userAgent,
    });
    return { status: 'ALREADY_USED' as const };
  }

  // Must be confirmed
  if (bookingDoc.status !== 'Confirmed') {
    await ScanEventModel.create({
      bookingId: bookingDoc._id,
      bookingCode,
      adminId: input.adminUserId,
      result: 'INVALID',
      scannedAt: new Date(),
      ip: input.ip,
      userAgent: input.userAgent,
    });
    return { status: 'INVALID' as const };
  }

  // Date must be today
  if (bookingDoc.date !== todayYmd()) {
    await ScanEventModel.create({
      bookingId: bookingDoc._id,
      bookingCode,
      adminId: input.adminUserId,
      result: 'EXPIRED',
      scannedAt: new Date(),
      ip: input.ip,
      userAgent: input.userAgent,
    });
    return { status: 'EXPIRED' as const };
  }

  // Time window check: now must fall into at least one booked slot window
  const slots = await SlotModel.find({ _id: { $in: bookingDoc.slotIds } }).lean();
  const okTime = isNowWithinAnySlot(slots as any);
  if (!okTime) {
    await ScanEventModel.create({
      bookingId: bookingDoc._id,
      bookingCode,
      adminId: input.adminUserId,
      result: 'EXPIRED',
      scannedAt: new Date(),
      ip: input.ip,
      userAgent: input.userAgent,
    });
    return { status: 'EXPIRED' as const };
  }

  // Consume
  bookingDoc.status = 'Checked In';
  bookingDoc.checkedInAt = new Date();
  await bookingDoc.save();

  const game = await GameModel.findById(bookingDoc.gameId).lean();

  await ScanEventModel.create({
    bookingId: bookingDoc._id,
    bookingCode,
    adminId: input.adminUserId,
    result: 'VALID',
    scannedAt: new Date(),
    ip: input.ip,
    userAgent: input.userAgent,
  });

  return {
    status: 'VALID' as const,
    booking: {
      id: bookingDoc.bookingId,
      date: bookingDoc.date,
      slots: bookingDoc.slotTimes,
      totalPrice: bookingDoc.totalPrice,
      gameId: bookingDoc.gameId.toString(),
      gameName: game?.name ?? '',
      status: bookingDoc.status,
      user: bookingDoc.guestName ?? 'Guest User',
      checkedInAt: bookingDoc.checkedInAt ? bookingDoc.checkedInAt.toISOString() : null,
    },
  };
}


