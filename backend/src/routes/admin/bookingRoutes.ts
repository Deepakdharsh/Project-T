import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import {
  adminCheckInSchema,
  adminDeleteBookingSchema,
  adminListBookingsSchema,
  adminUpdateBookingStatusSchema,
} from '../../validators/adminSchemas.js';
import { getBookings, patchBookingStatus, postCheckIn, removeBooking } from '../../controllers/adminBookingController.js';

export const adminBookingRoutes = Router();

adminBookingRoutes.get('/', validate(adminListBookingsSchema), asyncHandler(getBookings));
adminBookingRoutes.patch('/:bookingId/status', validate(adminUpdateBookingStatusSchema), asyncHandler(patchBookingStatus));
adminBookingRoutes.post('/:bookingId/checkin', validate(adminCheckInSchema), asyncHandler(postCheckIn));
adminBookingRoutes.delete('/:bookingId', validate(adminDeleteBookingSchema), asyncHandler(removeBooking));


