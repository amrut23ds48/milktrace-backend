import { Router, Request, Response, NextFunction } from 'express';
import { getFacility } from '../services/facilityService';

// ─── Facility Routes (API Layer) ──────────────────────────────────────────────
// Handles HTTP concerns only: extract params → call service → return response.
// No business logic lives here (BACKEND_GUIDELINES.md §2).

export const facilityRoutes = Router();

/**
 * GET /api/v1/facilities/:id
 * Fetch a facility by its UUID.
 * Returns: 200 FacilityResponse
 * Throws: 400 for invalid UUID, 404 for not found
 */
facilityRoutes.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params['id'] as string;
    const facility = await getFacility(id);
    res.status(200).json(facility);
  } catch (err) {
    next(err); // Delegate to centralized error handler
  }
});
