import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import {
  getVolumeTrend,
  getLossRate,
  getAnomalyBreakdown,
  getAnomalyByDistrict,
  getDistrictSummary,
} from '../services/analyticsService';

export const analyticsRoutes = Router();

const guard = [requireAuth, requirePermission('system.view')];

analyticsRoutes.get('/volume-trend', ...guard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, district } = req.query;
    const data = await getVolumeTrend(period as string, district as string);
    res.json(data);
  } catch (err) { next(err); }
});

analyticsRoutes.get('/loss-rate', ...guard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period, district } = req.query;
    const data = await getLossRate(period as string, district as string);
    res.json(data);
  } catch (err) { next(err); }
});

analyticsRoutes.get('/anomaly-breakdown', ...guard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period } = req.query;
    const data = await getAnomalyBreakdown(period as string);
    res.json(data);
  } catch (err) { next(err); }
});

analyticsRoutes.get('/anomaly-by-district', ...guard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getAnomalyByDistrict();
    res.json(data);
  } catch (err) { next(err); }
});

analyticsRoutes.get('/district-summary', ...guard, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getDistrictSummary();
    res.json(data);
  } catch (err) { next(err); }
});
