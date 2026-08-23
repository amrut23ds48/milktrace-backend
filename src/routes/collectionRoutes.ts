import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { CreateCollectionInput } from '../types/collection.types';
import { recordCollection } from '../services/collectionService';

export const collectionRoutes = Router();

/**
 * POST /api/v1/collections
 * Record a new milk collection.
 */
collectionRoutes.post('/', requireAuth, requirePermission('collection.create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateCollectionInput = req.body as CreateCollectionInput;
    const collection = await recordCollection(input);
    res.status(201).json(collection);
  } catch (err) {
    next(err);
  }
});
