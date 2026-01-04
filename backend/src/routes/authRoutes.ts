import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { loginSchema, registerSchema } from '../validators/authSchemas.js';
import { login, logout, refresh, register } from '../controllers/authController.js';

export const authRoutes = Router();

authRoutes.post('/register', authRateLimit, validate(registerSchema), asyncHandler(register));
authRoutes.post('/login', authRateLimit, validate(loginSchema), asyncHandler(login));
authRoutes.post('/refresh', asyncHandler(refresh));
authRoutes.post('/logout', asyncHandler(logout));


