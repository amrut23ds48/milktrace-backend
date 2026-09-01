import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { getAnimals, updateAnimalBaselines } from '../services/animalService';
import { UpdateAnimalBaselinesInput } from '../types/animal.types';

export const animalRoutes = Router();

/**
 * GET /api/v1/animals
 * Fetch all registered animals for baseline monitoring.
 */
animalRoutes.get('/', requireAuth, requirePermission('animal.view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const animals = await getAnimals();
    res.status(200).json(animals);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/animals/:id/baseline
 * Update expected baselines for a single animal.
 */
animalRoutes.put('/:id/baseline', requireAuth, requirePermission('animal.update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as UpdateAnimalBaselinesInput;
    const animal = await updateAnimalBaselines(req.params.id as string, input);
    res.status(200).json(animal);
  } catch (err) {
    next(err);
  }
});
