import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/requireRole.js';
import { adminBookingRoutes } from './bookingRoutes.js';
import { adminSlotRoutes } from './slotRoutes.js';
import { adminClosureRoutes } from './closureRoutes.js';
import { adminAnalyticsRoutes } from './analyticsRoutes.js';
import { adminScanRoutes } from './scanRoutes.js';
import { adminCatalogRoutes } from './catalogRoutes.js';
import { adminPaymentRoutes } from './paymentRoutes.js';

export const adminRoutes = Router();

adminRoutes.use(requireAuth, requireRole('admin'));

adminRoutes.use('/bookings', adminBookingRoutes);
adminRoutes.use('/slots', adminSlotRoutes);
adminRoutes.use('/closures', adminClosureRoutes);
adminRoutes.use('/analytics', adminAnalyticsRoutes);
adminRoutes.use('/scans', adminScanRoutes);
adminRoutes.use('/catalog', adminCatalogRoutes);
adminRoutes.use('/payments', adminPaymentRoutes);


