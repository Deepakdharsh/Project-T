import { BookingModel } from '../models/Booking.js';

export async function generateBookingId(): Promise<string> {
  // Simple human-friendly id like BK-1234 (retry on collision)
  for (let i = 0; i < 10; i++) {
    const id = `BK-${Math.floor(1000 + Math.random() * 9000)}`;
    const exists = await BookingModel.exists({ bookingId: id });
    if (!exists) return id;
  }
  // fallback
  return `BK-${Date.now()}`;
}


