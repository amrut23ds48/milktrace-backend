import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { getAnomalies } from '../services/anomalyService';

export const anomalyRoutes = Router();

anomalyRoutes.get('/', requireAuth, requirePermission('system.view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const anomalies = await getAnomalies();
    res.status(200).json(anomalies);
  } catch (err) {
    next(err);
  }
});
