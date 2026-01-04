import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { verifyScanSchema } from '../../validators/scanSchemas.js';
import { postVerifyScan } from '../../controllers/adminScanController.js';

export const adminScanRoutes = Router();

adminScanRoutes.post('/verify', validate(verifyScanSchema), asyncHandler(postVerifyScan));


