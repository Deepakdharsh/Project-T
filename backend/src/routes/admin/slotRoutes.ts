import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import {
  adminCreateSlotSchema,
  adminDeleteSlotSchema,
  adminGenerateSlotsSchema,
  adminRemoveAllSlotsSchema,
  adminUpdateSlotSchema,
} from '../../validators/adminSchemas.js';
import { patchSlot, postGenerateSlots, postSlot, removeAllSlots, removeSlot } from '../../controllers/adminSlotController.js';

export const adminSlotRoutes = Router();

adminSlotRoutes.post('/', validate(adminCreateSlotSchema), asyncHandler(postSlot));
adminSlotRoutes.post('/generate', validate(adminGenerateSlotsSchema), asyncHandler(postGenerateSlots));
adminSlotRoutes.patch('/:slotId', validate(adminUpdateSlotSchema), asyncHandler(patchSlot));
adminSlotRoutes.delete('/:slotId', validate(adminDeleteSlotSchema), asyncHandler(removeSlot));
adminSlotRoutes.delete('/', validate(adminRemoveAllSlotsSchema), asyncHandler(removeAllSlots));


