import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { CreateCollectionInput } from '../types/collection.types';
import { recordCollection, getCollections } from '../services/collectionService';

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

/**
 * GET /api/v1/collections
 * Fetch all milk collections.
 */
collectionRoutes.get('/', requireAuth, requirePermission('collection.view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const collections = await getCollections();
    res.status(200).json(collections);
  } catch (err) {
    next(err);
  }
});
