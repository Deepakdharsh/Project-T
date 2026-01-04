import type { Request, Response } from 'express';
import { createContactMessage } from '../services/contactService.js';

export async function postContact(req: Request, res: Response) {
  const { name, email, subject, message } = req.body as any;
  const result = await createContactMessage({ name, email, subject, message });
  return res.status(201).json({ message: 'Received', ...result });
}


