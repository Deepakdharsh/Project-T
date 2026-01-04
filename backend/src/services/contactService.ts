import { ContactMessageModel } from '../models/ContactMessage.js';

export async function createContactMessage(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const doc = await ContactMessageModel.create(input);
  return { id: doc._id.toString(), createdAt: doc.createdAt.toISOString() };
}


