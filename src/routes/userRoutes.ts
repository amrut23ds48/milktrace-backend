import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { createUser } from '../services/userService';
import { CreateUserInput } from '../types/user.types';

// ─── User Routes (API Layer) ──────────────────────────────────────────────────
// Handles HTTP concerns only: extract params → call service → return response.
// No business logic lives here (BACKEND_GUIDELINES.md §2).

export const userRoutes = Router();

/**
 * POST /api/v1/users
 * Create a new user.
 * Body: CreateUserInput
 * Returns: 201 SafeUser (no password_hash)
 */
userRoutes.post('/', requireAuth, requirePermission('user.create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input: CreateUserInput = req.body as CreateUserInput;
    const user = await createUser(input);
    res.status(201).json(user);
  } catch (err) {
    next(err); // Delegate to centralized error handler
  }
});
