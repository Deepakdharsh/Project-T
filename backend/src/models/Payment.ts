import mongoose, { Schema } from 'mongoose';

export type PaymentStatus = 'CREATED' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export interface PaymentDoc {
  _id: mongoose.Types.ObjectId;
  bookingId: string; // Booking.bookingId (e.g. BK-1234)
  userId?: mongoose.Types.ObjectId;

  // Razorpay identifiers
  orderId: string; // razorpay_order_id
  paymentId?: string; // razorpay_payment_id (set after verification)

  // Amount is stored in smallest currency unit (e.g. paise for INR).
  amount: number;
  currency: string; // e.g. INR

  paymentMethod?: string; // card/upi/netbanking/wallet/emi/...
  paymentStatus: PaymentStatus;

  // Sum of refunds in smallest unit.
  refundedAmount: number;

  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<PaymentDoc>(
  {
    bookingId: { type: String, required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },

    orderId: { type: String, required: true, unique: true, index: true },
    paymentId: { type: String, index: true },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, uppercase: true, trim: true },

    paymentMethod: { type: String, trim: true },
    paymentStatus: { type: String, required: true, enum: ['CREATED', 'SUCCESS', 'FAILED', 'REFUNDED'], index: true },

    refundedAmount: { type: Number, required: true, min: 0, default: 0 },
  },
  { timestamps: true }
);

paymentSchema.index({ bookingId: 1, createdAt: -1 });

export const PaymentModel =
  (mongoose.models.Payment as mongoose.Model<PaymentDoc>) || mongoose.model<PaymentDoc>('Payment', paymentSchema);



