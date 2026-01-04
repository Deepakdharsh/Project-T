import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { contactSchema } from '../validators/contactSchemas.js';
import { postContact } from '../controllers/contactController.js';

export const contactRoutes = Router();

contactRoutes.post('/', validate(contactSchema), asyncHandler(postContact));


