import type { Request, Response } from 'express';
import { createBooking, getBooking } from '../services/bookingService.js';

export async function postBooking(req: Request, res: Response) {
  const { date, gameId, slotIds, guest } = req.body as any;
  const result = await createBooking({ date, gameId, slotIds, guest });
  return res.status(201).json({ booking: result });
}

export async function getBookingById(req: Request, res: Response) {
  const { bookingId } = req.params as any;
  const result = await getBooking(bookingId);
  return res.json({ booking: result });
}


