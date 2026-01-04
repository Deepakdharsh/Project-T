import { ApiError } from '../utils/apiError.js';
import { BookingModel } from '../models/Booking.js';

export async function listBookings(filter: { date?: string; status?: string; gameId?: string }) {
  const q: any = {};
  if (filter.date) q.date = filter.date;
  if (filter.status) q.status = filter.status;
  if (filter.gameId) q.gameId = filter.gameId;

  const items = await BookingModel.find(q)
    .sort({ createdAt: -1 })
    .populate({ path: 'gameId', select: 'name' })
    .lean();

  return items.map((b: any) => ({
    id: b.bookingId,
    date: b.date,
    slots: b.slotTimes,
    totalPrice: b.totalPrice,
    gameId: (b.gameId?._id ?? b.gameId).toString(),
    gameName: b.gameId?.name ?? '',
    status: b.status,
    user: b.guestName ?? 'Guest User',
    checkedInAt: b.checkedInAt ? new Date(b.checkedInAt).toISOString() : null,
  }));
}

export async function setBookingStatus(bookingId: string, status: 'Confirmed' | 'Checked In' | 'Cancelled') {
  const booking = await BookingModel.findOne({ bookingId });
  if (!booking) throw new ApiError(404, 'Booking not found');

  booking.status = status;
  if (status === 'Checked In') booking.checkedInAt = booking.checkedInAt ?? new Date();
  if (status !== 'Checked In') booking.checkedInAt = null;
  await booking.save();

  return {
    id: booking.bookingId,
    status: booking.status,
    checkedInAt: booking.checkedInAt ? booking.checkedInAt.toISOString() : null,
  };
}

export async function checkInBooking(bookingId: string) {
  const booking = await BookingModel.findOne({ bookingId });
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.status === 'Cancelled') throw new ApiError(409, 'Booking is cancelled');
  if (booking.status === 'Checked In') throw new ApiError(409, 'Booking already checked in');

  booking.status = 'Checked In';
  booking.checkedInAt = new Date();
  await booking.save();

  return { id: booking.bookingId, status: booking.status, checkedInAt: booking.checkedInAt.toISOString() };
}

export async function deleteBooking(bookingId: string) {
  await BookingModel.deleteOne({ bookingId });
}


