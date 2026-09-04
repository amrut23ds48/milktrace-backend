import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { getAnomalies } from '../services/anomalyService';

export const anomalyRoutes = Router();

anomalyRoutes.get('/', requireAuth, requirePermission('system.view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, severity, entity_type, page, limit } = req.query;
    const result = await getAnomalies({
      status: status as string | undefined,
      severity: severity as string | undefined,
      entity_type: entity_type as string | undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 10,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
