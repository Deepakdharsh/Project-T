import { z } from 'zod';

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

const createOrderForNewBookingBody = z
  .object({
    date: z.string().min(10).max(10), // YYYY-MM-DD
    gameId: objectIdSchema,
    slotIds: z.array(objectIdSchema).min(1),
    guest: z
      .object({
        name: z.string().min(2).max(80),
        email: z.string().email(),
      })
      .strict(),
  })
  .strict();

const createOrderForExistingBookingBody = z
  .object({
    bookingId: z.string().min(1).max(40),
  })
  .strict();

export const createRazorpayOrderSchema = z.object({
  body: z.union([createOrderForExistingBookingBody, createOrderForNewBookingBody]),
});

export const verifyRazorpayPaymentSchema = z.object({
  body: z
    .object({
      bookingId: z.string().min(1).max(40),
      orderId: z.string().min(1),
      paymentId: z.string().min(1),
      signature: z.string().min(1),
    })
    .strict(),
});

export const adminRefundSchema = z.object({
  body: z
    .object({
      paymentId: z.string().min(1), // razorpay_payment_id
      // Amount in rupees. If omitted -> full refund.
      amountRupees: z.number().positive().optional(),
    })
    .strict(),
});



