import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { listClosuresSchema, listGamesSchema, listSlotsSchema } from '../validators/catalogSchemas.js';
import { getCategories, getClosures, getGames, getSlots } from '../controllers/catalogController.js';

export const catalogRoutes = Router();

catalogRoutes.get('/categories', asyncHandler(getCategories));
catalogRoutes.get('/games', validate(listGamesSchema), asyncHandler(getGames));
catalogRoutes.get('/slots', validate(listSlotsSchema), asyncHandler(getSlots));
catalogRoutes.get('/closures', validate(listClosuresSchema), asyncHandler(getClosures));


