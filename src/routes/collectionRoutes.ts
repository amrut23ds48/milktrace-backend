import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { CreateCollectionInput } from '../types/collection.types';
import { recordCollection, getCollections, getCollectionsByFacility, getDailySummary, cancelCollection, getCollectionById } from '../services/collectionService';

export const collectionRoutes = Router();

/**
 * POST /api/v1/collections
 * Record a new milk collection.
 */
collectionRoutes.post('/', requireAuth, requirePermission('collection.create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateCollectionInput = req.body as CreateCollectionInput;
    
    // Role scoping: If user is bound to a facility, they can only submit for that facility
    if (req.user?.facilityId && req.user.facilityId !== input.facility_id) {
      return res.status(403).json({ error: 'Forbidden: Cannot submit collections for other facilities' });
    }
    // If user has no facilityId (Super Admin) but wants to submit, the plan says read-only for Super Admin.
    if (!req.user?.facilityId) {
       return res.status(403).json({ error: 'Forbidden: Collections can only be recorded by facility operators' });
    }

    const collection = await recordCollection(input);
    res.status(201).json(collection);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/collections/summary/daily
 */
collectionRoutes.get('/summary/daily', requireAuth, requirePermission('collection.view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { facility_id, date } = req.query;
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }
    
    if (req.user?.facilityId) {
      facility_id = req.user.facilityId;
    }
    
    if (!facility_id) {
      return res.status(400).json({ error: 'facility_id is required' });
    }

    const summary = await getDailySummary(facility_id as string, date as string);
    res.status(200).json(summary);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/collections/:id
 */
collectionRoutes.get('/:id', requireAuth, requirePermission('collection.view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const collection = await getCollectionById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    if (req.user?.facilityId && collection.facility_id !== req.user.facilityId) {
      return res.status(403).json({ error: 'Forbidden: Collection belongs to another facility' });
    }
    res.status(200).json(collection);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/collections/:id/cancel
 */
collectionRoutes.put('/:id/cancel', requireAuth, requirePermission('collection.update'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ error: 'Cancellation reason is required' });
    }
    
    const collection = await getCollectionById(id);
    if (!collection) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    if (req.user?.facilityId && collection.facility_id !== req.user.facilityId) {
      return res.status(403).json({ error: 'Forbidden: Cannot cancel collection at another facility' });
    }
    
    const updated = await cancelCollection(id, reason, req.user?.userId || 'system');
    res.status(200).json(updated);
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
    const { date, session, status } = req.query;
    let facilityIdToUse = req.query.facility_id as string | undefined;

    if (req.user?.facilityId) {
      facilityIdToUse = req.user.facilityId;
    }

    const opts: any = {};
    if (date) opts.date = date as string;
    if (session) opts.session = session as 'MORNING' | 'EVENING';
    if (status) opts.status = status as string;

    let collections;
    if (facilityIdToUse) {
      collections = await getCollectionsByFacility(facilityIdToUse, opts);
    } else {
      collections = await getCollections(opts);
    }
    
    res.status(200).json(collections);
  } catch (err) {
    next(err);
  }
});
