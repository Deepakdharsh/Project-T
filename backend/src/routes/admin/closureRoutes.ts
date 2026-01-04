import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import { adminCreateClosureSchema, adminDeleteClosureSchema } from '../../validators/adminSchemas.js';
import { getClosures, postClosure, removeClosure } from '../../controllers/adminClosureController.js';

export const adminClosureRoutes = Router();

adminClosureRoutes.get('/', asyncHandler(getClosures));
adminClosureRoutes.post('/', validate(adminCreateClosureSchema), asyncHandler(postClosure));
adminClosureRoutes.delete('/:closureId', validate(adminDeleteClosureSchema), asyncHandler(removeClosure));


