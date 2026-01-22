import mongoose, { Schema } from 'mongoose';

export type BookingStatus = 'Payment Pending' | 'Confirmed' | 'Checked In' | 'Cancelled';

export interface BookingDoc {
  _id: mongoose.Types.ObjectId;
  bookingId: string; // e.g. BK-1234
  date: string; // YYYY-MM-DD
  gameId: mongoose.Types.ObjectId;
  slotIds: mongoose.Types.ObjectId[];
  slotTimes: string[]; // frontend-compatible time labels
  totalPrice: number;
  status: BookingStatus;
  userId?: mongoose.Types.ObjectId;
  guestName?: string;
  guestEmail?: string;
  checkedInAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<BookingDoc>(
  {
    bookingId: { type: String, required: true, unique: true, index: true },
    date: { type: String, required: true, index: true },
    gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
    slotIds: [{ type: Schema.Types.ObjectId, ref: 'Slot', required: true }],
    slotTimes: [{ type: String, required: true }],
    totalPrice: { type: Number, required: true, min: 0 },
    status: { type: String, required: true, enum: ['Payment Pending', 'Confirmed', 'Checked In', 'Cancelled'], default: 'Confirmed' },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    guestName: { type: String, trim: true },
    guestEmail: { type: String, trim: true, lowercase: true },
    checkedInAt: { type: Date, default: null },
  },
  { timestamps: true }
);

bookingSchema.index({ date: 1, gameId: 1 });

export const BookingModel =
  (mongoose.models.Booking as mongoose.Model<BookingDoc>) || mongoose.model<BookingDoc>('Booking', bookingSchema);


