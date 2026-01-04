import mongoose, { Schema } from 'mongoose';

export type ClosureType = 'full' | 'partial';

export interface ClosureDoc {
  _id: mongoose.Types.ObjectId;
  type: ClosureType;
  date: string; // YYYY-MM-DD
  startHour?: number;
  endHour?: number;
  reason: string;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const closureSchema = new Schema<ClosureDoc>(
  {
    type: { type: String, required: true, enum: ['full', 'partial'] },
    date: { type: String, required: true, index: true },
    startHour: { type: Number, min: 0, max: 23 },
    endHour: { type: Number, min: 1, max: 24 },
    reason: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
  },
  { timestamps: true }
);

closureSchema.index({ date: 1, type: 1, startHour: 1, endHour: 1 }, { unique: true });

export const ClosureModel =
  (mongoose.models.Closure as mongoose.Model<ClosureDoc>) ||
  mongoose.model<ClosureDoc>('Closure', closureSchema);


