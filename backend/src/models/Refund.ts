import mongoose, { Schema } from 'mongoose';

export type RefundStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export interface RefundDoc {
  _id: mongoose.Types.ObjectId;
  payment: mongoose.Types.ObjectId; // Payment _id
  refundId: string; // razorpay_refund_id
  refundedAmount: number; // smallest currency unit
  refundStatus: RefundStatus;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const refundSchema = new Schema<RefundDoc>(
  {
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true, index: true },
    refundId: { type: String, required: true, unique: true, index: true },
    refundedAmount: { type: Number, required: true, min: 1 },
    refundStatus: { type: String, required: true, enum: ['PENDING', 'PROCESSED', 'FAILED'], index: true },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

refundSchema.index({ payment: 1, createdAt: -1 });

export const RefundModel =
  (mongoose.models.Refund as mongoose.Model<RefundDoc>) || mongoose.model<RefundDoc>('Refund', refundSchema);



