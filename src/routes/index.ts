import { Router } from 'express';
import { userRoutes } from './userRoutes';
import { facilityRoutes } from './facilityRoutes';

// ─── API Route Barrel ─────────────────────────────────────────────────────────
// All feature routers are mounted here and exported as a single `router`.
// app.ts mounts this at /api/v1.

export const router = Router();

router.use('/users', userRoutes);
router.use('/facilities', facilityRoutes);
