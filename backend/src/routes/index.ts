import { Router } from 'express';
import { authRoutes } from './authRoutes.js';
import { catalogRoutes } from './catalogRoutes.js';
import { bookingRoutes } from './bookingRoutes.js';
import { contactRoutes } from './contactRoutes.js';
import { adminRoutes } from './admin/index.js';

export const routes = Router();

routes.use('/auth', authRoutes);
routes.use('/catalog', catalogRoutes);
routes.use('/bookings', bookingRoutes);
routes.use('/contact', contactRoutes);
routes.use('/admin', adminRoutes);


