import type { Request, Response } from 'express';
import { refundRazorpayPayment } from '../services/paymentService.js';

export async function postRefund(req: Request, res: Response) {
  const { paymentId, amountRupees } = req.body as any;
  const result = await refundRazorpayPayment({ paymentId, amountRupees });
  return res.status(201).json({
    payment: {
      orderId: result.payment.orderId,
      paymentId: result.payment.paymentId,
      amount: result.payment.amount,
      currency: result.payment.currency,
      paymentMethod: result.payment.paymentMethod,
      paymentStatus: result.payment.paymentStatus,
      refundedAmount: result.payment.refundedAmount,
      updatedAt: result.payment.updatedAt,
    },
    refund: result.refund,
  });
}



