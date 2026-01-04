import mongoose, { Schema } from 'mongoose';

export type ScanResult = 'VALID' | 'INVALID' | 'EXPIRED' | 'ALREADY_USED';

export interface ScanEventDoc {
  _id: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  bookingCode?: string;
  adminId: mongoose.Types.ObjectId;
  result: ScanResult;
  scannedAt: Date;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const scanEventSchema = new Schema<ScanEventDoc>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    bookingCode: { type: String, trim: true },
    adminId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    result: { type: String, required: true, enum: ['VALID', 'INVALID', 'EXPIRED', 'ALREADY_USED'] },
    scannedAt: { type: Date, required: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { timestamps: true }
);

scanEventSchema.index({ scannedAt: -1 });

export const ScanEventModel =
  (mongoose.models.ScanEvent as mongoose.Model<ScanEventDoc>) ||
  mongoose.model<ScanEventDoc>('ScanEvent', scanEventSchema);


