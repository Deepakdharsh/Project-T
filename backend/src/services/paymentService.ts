import { ApiError } from '../utils/apiError.js';
import { createBooking, getBooking } from './bookingService.js';
import { PaymentModel } from '../models/Payment.js';
import { BookingModel } from '../models/Booking.js';
import { RefundModel } from '../models/Refund.js';
import { getRazorpayClient } from '../utils/razorpay.js';
import { verifyRazorpaySignature } from '../utils/razorpaySignature.js';
import { sendBookingConfirmationEmail } from '../utils/mailer.js';

export async function createRazorpayOrderForBooking(input: {
  bookingId?: string;
  date?: string;
  gameId?: string;
  slotIds?: string[];
  guest?: { name: string; email: string };
  userId?: string;
}) {
  // Ensure Razorpay is configured before we create (or lock) any "Payment Pending" booking.
  const rp = getRazorpayClient();

  const booking =
    input.bookingId
      ? await getBooking(input.bookingId)
      : await createBooking({
          date: input.date as string,
          gameId: input.gameId as string,
          slotIds: input.slotIds as string[],
          userId: input.userId,
          guest: input.guest as { name: string; email: string },
          status: 'Payment Pending',
        });

  // Ensure booking is still pending payment.
  const bookingDoc = await BookingModel.findOne({ bookingId: booking.id }).lean();
  if (!bookingDoc) throw new ApiError(404, 'Booking not found');
  if (bookingDoc.status !== 'Payment Pending') throw new ApiError(409, 'Booking is not pending payment');

  // Idempotency: if we already created an order for this booking and it's still unpaid, reuse it.
  const existing = await PaymentModel.findOne({
    bookingId: booking.id,
    paymentStatus: 'CREATED',
    paymentId: { $exists: false },
  }).sort({ createdAt: -1 });
  if (existing) {
    return {
      booking,
      razorpay: {
        orderId: existing.orderId,
        amount: existing.amount,
        currency: existing.currency,
      },
    };
  }

  // booking.totalPrice is stored in rupees. Razorpay expects paise.
  const amountPaise = Math.round(Number(booking.totalPrice) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise <= 0) throw new ApiError(400, 'Invalid amount');

  const order = await rp.orders.create({
    amount: amountPaise,
    currency: 'INR',
    receipt: booking.id,
    notes: {
      bookingId: booking.id,
      guestEmail: bookingDoc.guestEmail || '',
    },
  });

  await PaymentModel.create({
    bookingId: booking.id,
    userId: bookingDoc.userId,
    orderId: order.id,
    amount: amountPaise,
    currency: order.currency,
    paymentStatus: 'CREATED',
    refundedAmount: 0,
  });

  return {
    booking,
    razorpay: {
      orderId: order.id,
      amount: amountPaise,
      currency: order.currency,
    },
  };
}

export async function verifyRazorpayPayment(input: {
  bookingId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const payment = await PaymentModel.findOne({ orderId: input.orderId, bookingId: input.bookingId });
  if (!payment) throw new ApiError(404, 'Payment order not found');

  // Idempotency: if already verified, return success again.
  if (payment.paymentStatus === 'SUCCESS' && payment.paymentId === input.paymentId) {
    return { payment, bookingId: input.bookingId };
  }

  const sigOk = verifyRazorpaySignature({
    orderId: input.orderId,
    paymentId: input.paymentId,
    signature: input.signature,
  });
  if (!sigOk) {
    payment.paymentStatus = 'FAILED';
    await payment.save();
    throw new ApiError(400, 'Invalid payment signature');
  }

  const rp = getRazorpayClient();
  const rpPayment = await rp.payments.fetch(input.paymentId);

  if ((rpPayment as any).order_id !== input.orderId) throw new ApiError(400, 'Order mismatch');
  if ((rpPayment as any).status !== 'captured') throw new ApiError(409, `Payment not captured (status: ${(rpPayment as any).status})`);
  if (Number((rpPayment as any).amount) !== payment.amount) throw new ApiError(409, 'Amount mismatch');

  payment.paymentId = input.paymentId;
  payment.paymentMethod = (rpPayment as any).method;
  payment.currency = (rpPayment as any).currency?.toUpperCase?.() || payment.currency;
  payment.paymentStatus = 'SUCCESS';
  await payment.save();

  // Mark booking confirmed (only after signature verification).
  await BookingModel.updateOne({ bookingId: input.bookingId }, { $set: { status: 'Confirmed' } });

  // Fire-and-forget confirmation email (best effort).
  try {
    const booking = await BookingModel.findOne({ bookingId: input.bookingId }).lean();
    const email = booking?.guestEmail;
    if (email) {
      await sendBookingConfirmationEmail({
        to: email,
        bookingId: input.bookingId,
        paymentId: input.paymentId,
        amountRupees: Math.round(payment.amount / 100),
        date: booking?.date || '',
        slots: booking?.slotTimes || [],
      });
    }
  } catch {
    // ignore
  }

  return { payment, bookingId: input.bookingId };
}

export async function refundRazorpayPayment(input: { paymentId: string; amountRupees?: number }) {
  const payment = await PaymentModel.findOne({ paymentId: input.paymentId });
  if (!payment) throw new ApiError(404, 'Payment not found');
  if (!payment.paymentId) throw new ApiError(409, 'Payment is not verified yet');
  if (payment.paymentStatus !== 'SUCCESS' && payment.paymentStatus !== 'REFUNDED') {
    throw new ApiError(409, 'Only successful payments can be refunded');
  }

  // Prevent duplicate/reflooded refund calls while a refund is still pending.
  const hasPendingRefund = await RefundModel.exists({ payment: payment._id, refundStatus: 'PENDING' });
  if (hasPendingRefund) throw new ApiError(409, 'A refund is already in progress for this payment');

  const remaining = payment.amount - payment.refundedAmount;
  if (remaining <= 0) throw new ApiError(409, 'Payment is already fully refunded');

  const refundAmountPaise =
    typeof input.amountRupees === 'number' ? Math.round(input.amountRupees * 100) : remaining;

  if (!Number.isFinite(refundAmountPaise) || refundAmountPaise <= 0) throw new ApiError(400, 'Invalid refund amount');
  if (refundAmountPaise > remaining) throw new ApiError(409, 'Refund amount exceeds refundable balance');

  const rp = getRazorpayClient();
  const rpRefund = await rp.payments.refund(input.paymentId, { amount: refundAmountPaise });

  const statusRaw = String((rpRefund as any).status || 'pending').toLowerCase();
  const mappedStatus = statusRaw === 'processed' ? 'PROCESSED' : statusRaw === 'failed' ? 'FAILED' : 'PENDING';
  const refundDoc = await RefundModel.create({
    payment: payment._id,
    refundId: (rpRefund as any).id,
    refundedAmount: refundAmountPaise,
    refundStatus: mappedStatus,
    refundedAt: (rpRefund as any).created_at ? new Date(((rpRefund as any).created_at as number) * 1000) : null,
  });

  payment.refundedAmount += refundAmountPaise;
  if (payment.refundedAmount >= payment.amount) payment.paymentStatus = 'REFUNDED';
  await payment.save();

  return {
    payment,
    refund: {
      refundId: refundDoc.refundId,
      refundedAmount: refundDoc.refundedAmount,
      refundStatus: refundDoc.refundStatus,
      refundedAt: refundDoc.refundedAt,
    },
  };
}


