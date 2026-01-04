import mongoose, { Schema } from 'mongoose';

export interface SlotDoc {
  _id: mongoose.Types.ObjectId;
  gameId: mongoose.Types.ObjectId;
  startHour: number; // 0-23
  endHour: number; // 1-24
  timeLabel: string; // e.g. "6:00 PM - 7:00 PM"
  price: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const slotSchema = new Schema<SlotDoc>(
  {
    gameId: { type: Schema.Types.ObjectId, ref: 'Game', required: true, index: true },
    startHour: { type: Number, required: true, min: 0, max: 23 },
    endHour: { type: Number, required: true, min: 1, max: 24 },
    timeLabel: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true }
);

slotSchema.index({ gameId: 1, startHour: 1 }, { unique: true });

export const SlotModel =
  (mongoose.models.Slot as mongoose.Model<SlotDoc>) || mongoose.model<SlotDoc>('Slot', slotSchema);


