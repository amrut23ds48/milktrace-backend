import { Router, Request, Response, NextFunction } from 'express';
import { CreateFarmerInput } from '../types/farmer.types';
import { registerFarmer } from '../services/farmerService';

export const farmerRoutes = Router();

/**
 * POST /api/v1/farmers
 * Register a new farmer.
 */
farmerRoutes.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateFarmerInput = req.body as CreateFarmerInput;
    const farmer = await registerFarmer(input);
    res.status(201).json(farmer);
  } catch (err) {
    next(err);
  }
});
