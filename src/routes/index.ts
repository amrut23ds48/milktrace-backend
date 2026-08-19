import { Router } from 'express';
import { userRoutes } from './userRoutes';
import { facilityRoutes } from './facilityRoutes';
import { farmerRoutes } from './farmerRoutes';
import { collectionRoutes } from './collectionRoutes';
import { batchRoutes } from './batchRoutes';
import { transferRoutes } from './transferRoutes';

// ─── API Route Barrel ─────────────────────────────────────────────────────────
// All feature routers are mounted here and exported as a single `router`.
// app.ts mounts this at /api/v1.

export const router = Router();

router.use('/users', userRoutes);
router.use('/facilities', facilityRoutes);
router.use('/farmers', farmerRoutes);
router.use('/collections', collectionRoutes);
router.use('/batches', batchRoutes);
router.use('/transfers', transferRoutes);
