import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { createBookingSchema, getBookingSchema } from '../validators/bookingSchemas.js';
import { getBookingById, postBooking } from '../controllers/bookingController.js';

export const bookingRoutes = Router();

bookingRoutes.post('/', validate(createBookingSchema), asyncHandler(postBooking));
bookingRoutes.get('/:bookingId', validate(getBookingSchema), asyncHandler(getBookingById));


