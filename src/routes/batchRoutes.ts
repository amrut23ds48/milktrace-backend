import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { batchService } from '../services/batchService';
import { CreateBatchRequest } from '../types/batch.types';

const router = Router();

router.post('/', requireAuth, requirePermission('batch.create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data: CreateBatchRequest = req.body;
    const batch = await batchService.createBatch(data);
    
    res.status(201).json({
      success: true,
      data: batch
    });
  } catch (error) {
    next(error);
  }
});

export { router as batchRoutes };
