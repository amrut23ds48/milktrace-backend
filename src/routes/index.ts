import { Router } from 'express';
import { roleRoutes } from './roleRoutes';
import { userRoutes } from './userRoutes';
import { facilityRoutes } from './facilityRoutes';
import { farmerRoutes } from './farmerRoutes';
import { collectionRoutes } from './collectionRoutes';
import { batchRoutes } from './batchRoutes';
import { transferRoutes } from './transferRoutes';
import { authRoutes } from './authRoutes';
import { anomalyRoutes } from './anomalyRoutes';
import { animalRoutes } from './animalRoutes';
import { mapRoutes } from './mapRoutes';

// ─── API Route Barrel ─────────────────────────────────────────────────────────
// All feature routers are mounted here and exported as a single `router`.
// app.ts mounts this at /api/v1.

export const router = Router();

router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/facilities', facilityRoutes);
router.use('/farmers', farmerRoutes);
router.use('/collections', collectionRoutes);
router.use('/batches', batchRoutes);
router.use('/transfers', transferRoutes);
router.use('/auth', authRoutes);
router.use('/anomalies', anomalyRoutes);
router.use('/animals', animalRoutes);
router.use('/map', mapRoutes);
