import mongoose, { Schema } from 'mongoose';

export interface ContactMessageDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<ContactMessageDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const ContactMessageModel =
  (mongoose.models.ContactMessage as mongoose.Model<ContactMessageDoc>) ||
  mongoose.model<ContactMessageDoc>('ContactMessage', contactMessageSchema);


