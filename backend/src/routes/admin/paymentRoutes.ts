import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { postRefund } from '../../controllers/adminPaymentController.js';
import { adminRefundSchema } from '../../validators/paymentSchemas.js';

export const adminPaymentRoutes = Router();

adminPaymentRoutes.post('/refunds', validate(adminRefundSchema), asyncHandler(postRefund));



