import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { CreateFarmerInput } from '../types/farmer.types';
import { registerFarmer, getFarmers } from '../services/farmerService';

export const farmerRoutes = Router();

/**
 * POST /api/v1/farmers
 * Register a new farmer.
 */
farmerRoutes.post('/', requireAuth, requirePermission('farmer.create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateFarmerInput = req.body as CreateFarmerInput;
    const farmer = await registerFarmer(input);
    res.status(201).json(farmer);
  } catch (err) {
    next(err);
  }
});

farmerRoutes.get('/', requireAuth, requirePermission('farmer.view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const farmers = await getFarmers();
    res.status(200).json(farmers);
  } catch (err) {
    next(err);
  }
});
