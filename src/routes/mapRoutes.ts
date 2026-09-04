import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { mapService } from '../services/mapService';

const router = Router();

// Protect all map endpoints (Super Admin or those with system.view)
router.use(requireAuth, requirePermission('system.view'));

router.get('/facilities', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facilities = await mapService.getFacilities();
    res.status(200).json(facilities);
  } catch (error) {
    next(error);
  }
});

router.get('/routes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const routes = await mapService.getRoutes();
    res.status(200).json(routes);
  } catch (error) {
    next(error);
  }
});

router.get('/district-stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await mapService.getDistrictStats();
    res.status(200).json(stats);
  } catch (error) {
    next(error);
  }
});

export { router as mapRoutes };
