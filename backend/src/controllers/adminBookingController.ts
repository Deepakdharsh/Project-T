import type { Request, Response } from 'express';
import { checkInBooking, deleteBooking, listBookings, setBookingStatus } from '../services/adminBookingService.js';

export async function getBookings(req: Request, res: Response) {
  const { date, status, gameId } = req.query as any;
  const bookings = await listBookings({ date, status, gameId });
  return res.json({ bookings });
}

export async function patchBookingStatus(req: Request, res: Response) {
  const { bookingId } = req.params as any;
  const { status } = req.body as any;
  const result = await setBookingStatus(bookingId, status);
  return res.json({ booking: result });
}

export async function postCheckIn(req: Request, res: Response) {
  const { bookingId } = req.params as any;
  const result = await checkInBooking(bookingId);
  return res.json({ booking: result });
}

export async function removeBooking(req: Request, res: Response) {
  const { bookingId } = req.params as any;
  await deleteBooking(bookingId);
  return res.status(204).send();
}


