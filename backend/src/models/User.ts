import mongoose, { Schema } from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface UserDoc {
  _id: mongoose.Types.ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true }
);

export const UserModel =
  (mongoose.models.User as mongoose.Model<UserDoc>) || mongoose.model<UserDoc>('User', userSchema);


