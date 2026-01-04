import mongoose, { Schema } from 'mongoose';

export interface RefreshTokenDoc {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  tokenHash: string; // sha256(token)
  expiresAt: Date;
  revokedAt?: Date | null;
  replacedByTokenHash?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const refreshTokenSchema = new Schema<RefreshTokenDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedByTokenHash: { type: String, default: null },
  },
  { timestamps: true }
);

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshTokenModel =
  (mongoose.models.RefreshToken as mongoose.Model<RefreshTokenDoc>) ||
  mongoose.model<RefreshTokenDoc>('RefreshToken', refreshTokenSchema);


