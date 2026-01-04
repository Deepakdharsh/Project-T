import mongoose, { Schema } from 'mongoose';

export interface GameDoc {
  _id: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const gameSchema = new Schema<GameDoc>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

gameSchema.index({ categoryId: 1, name: 1 }, { unique: true });

export const GameModel =
  (mongoose.models.Game as mongoose.Model<GameDoc>) || mongoose.model<GameDoc>('Game', gameSchema);


