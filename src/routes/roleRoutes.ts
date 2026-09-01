import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth, requirePermission } from '../middleware/auth';
import { getRoles, createRole, getPermissions } from '../services/roleService';

export const roleRoutes = Router();

roleRoutes.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await getRoles();
    res.status(200).json(roles);
  } catch (err) {
    next(err);
  }
});

roleRoutes.get('/permissions', requireAuth, requirePermission('role.view'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const permissions = await getPermissions();
    res.status(200).json(permissions);
  } catch (err) {
    next(err);
  }
});

roleRoutes.post('/', requireAuth, requirePermission('role.create'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const role = await createRole(req.body);
    res.status(201).json(role);
  } catch (err) {
    next(err);
  }
});
