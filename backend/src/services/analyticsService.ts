import { BookingModel } from '../models/Booking.js';

export async function getAnalytics(filter: { from?: string; to?: string }) {
  const q: any = {};
  if (filter.from || filter.to) {
    q.date = {};
    if (filter.from) q.date.$gte = filter.from;
    if (filter.to) q.date.$lte = filter.to;
  }

  const bookings = await BookingModel.find(q).lean();
  const nonCancelled = bookings.filter((b: any) => b.status !== 'Cancelled');

  const totalRevenue = nonCancelled.reduce((s: number, b: any) => s + (b.totalPrice || 0), 0);
  const totalBookings = bookings.length;

  const byStatus = bookings.reduce((acc: Record<string, number>, b: any) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const revenueByDate = nonCancelled.reduce((acc: Record<string, number>, b: any) => {
    acc[b.date] = (acc[b.date] || 0) + (b.totalPrice || 0);
    return acc;
  }, {} as Record<string, number>);

  const revenueByGame = nonCancelled.reduce((acc: Record<string, number>, b: any) => {
    const key = b.gameId.toString();
    acc[key] = (acc[key] || 0) + (b.totalPrice || 0);
    return acc;
  }, {} as Record<string, number>);

  return {
    totalRevenue,
    totalBookings,
    activeBookings: nonCancelled.length,
    byStatus,
    revenueByDate,
    revenueByGame,
  };
}


