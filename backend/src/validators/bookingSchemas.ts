import { z } from 'zod';

export const createBookingSchema = z.object({
  body: z.object({
    date: z.string().min(10).max(10), // YYYY-MM-DD
    gameId: z.string().min(1),
    slotIds: z.array(z.string().min(1)).min(1),
    paymentMethod: z.enum(['card', 'gpay']).default('card'),
    guest: z
      .object({
        name: z.string().min(2).max(80),
        email: z.string().email().optional(),
      })
      .optional(),
  }),
});

export const getBookingSchema = z.object({
  params: z.object({
    bookingId: z.string().min(1),
  }),
});


