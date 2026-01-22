import type { Request, Response } from 'express';
import { env } from '../config/env.js';
import { createRazorpayOrderForBooking, verifyRazorpayPayment } from '../services/paymentService.js';
import { getBooking } from '../services/bookingService.js';

export async function postCreateRazorpayOrder(req: Request, res: Response) {
  const { bookingId, date, gameId, slotIds, guest } = req.body as any;

  const result = await createRazorpayOrderForBooking({
    bookingId,
    date,
    gameId,
    slotIds,
    guest,
    userId: (req as any).auth?.userId,
  });

  return res.status(201).json({
    booking: result.booking,
    razorpay: {
      keyId: env.RAZORPAY_KEY_ID,
      orderId: result.razorpay.orderId,
      amount: result.razorpay.amount,
      currency: result.razorpay.currency,
    },
  });
}

export async function postVerifyRazorpayPayment(req: Request, res: Response) {
  const { bookingId, orderId, paymentId, signature } = req.body as any;

  const out = await verifyRazorpayPayment({ bookingId, orderId, paymentId, signature });
  const booking = await getBooking(out.bookingId);

  return res.json({
    booking,
    payment: {
      orderId: out.payment.orderId,
      paymentId: out.payment.paymentId,
      amount: out.payment.amount,
      currency: out.payment.currency,
      paymentMethod: out.payment.paymentMethod,
      paymentStatus: out.payment.paymentStatus,
      refundedAmount: out.payment.refundedAmount,
      createdAt: out.payment.createdAt,
    },
  });
}



