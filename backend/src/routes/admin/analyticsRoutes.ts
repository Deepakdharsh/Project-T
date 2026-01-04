import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { adminAnalyticsSchema } from '../../validators/adminSchemas.js';
import { getAdminAnalytics } from '../../controllers/adminAnalyticsController.js';

export const adminAnalyticsRoutes = Router();

adminAnalyticsRoutes.get('/', validate(adminAnalyticsSchema), asyncHandler(getAdminAnalytics));


