import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { paymentRateLimit, paymentUserRateLimit } from '../middleware/rateLimit.js';
import { postCreateRazorpayOrder, postVerifyRazorpayPayment } from '../controllers/paymentController.js';
import { createRazorpayOrderSchema, verifyRazorpayPaymentSchema } from '../validators/paymentSchemas.js';

export const paymentRoutes = Router();

paymentRoutes.post(
  '/create-order',
  paymentRateLimit,
  paymentUserRateLimit,
  validate(createRazorpayOrderSchema),
  asyncHandler(postCreateRazorpayOrder)
);
paymentRoutes.post(
  '/verify',
  paymentRateLimit,
  paymentUserRateLimit,
  validate(verifyRazorpayPaymentSchema),
  asyncHandler(postVerifyRazorpayPayment)
);



