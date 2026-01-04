import { Router } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler.js';
import { validate } from '../../middleware/validate.js';
import {
  adminCreateCategorySchema,
  adminCreateGameSchema,
  adminDeleteCategorySchema,
  adminDeleteGameSchema,
  adminUpdateCategorySchema,
  adminUpdateGameSchema,
} from '../../validators/adminSchemas.js';
import {
  getCategories,
  getGames,
  patchCategory,
  patchGame,
  postCategory,
  postGame,
  removeCategory,
  removeGame,
} from '../../controllers/adminCatalogController.js';

export const adminCatalogRoutes = Router();

adminCatalogRoutes.get('/categories', asyncHandler(getCategories));
adminCatalogRoutes.post('/categories', validate(adminCreateCategorySchema), asyncHandler(postCategory));
adminCatalogRoutes.patch('/categories/:categoryId', validate(adminUpdateCategorySchema), asyncHandler(patchCategory));
adminCatalogRoutes.delete('/categories/:categoryId', validate(adminDeleteCategorySchema), asyncHandler(removeCategory));

adminCatalogRoutes.get('/games', asyncHandler(getGames));
adminCatalogRoutes.post('/games', validate(adminCreateGameSchema), asyncHandler(postGame));
adminCatalogRoutes.patch('/games/:gameId', validate(adminUpdateGameSchema), asyncHandler(patchGame));
adminCatalogRoutes.delete('/games/:gameId', validate(adminDeleteGameSchema), asyncHandler(removeGame));


