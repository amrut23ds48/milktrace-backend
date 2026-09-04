import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Secret from environment or fallback for dev
const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // ─── Dev Bypass (no DB query — hardcoded permissions for speed & reliability) ───
    // Super Admin mock: has system.view which grants god-mode in requirePermission
    if (token === 'mock-jwt-token') {
      req.user = {
        userId: 'dev-super-admin',
        roleId: 'SUPER_ADMIN',
        organizationId: 'dev-org',
        facilityId: null,
        permissions: [
          'system.view',
          'user.create', 'user.view', 'user.update', 'user.delete',
          'role.create', 'role.view', 'role.update', 'role.delete',
          'facility.create', 'facility.view', 'facility.update', 'facility.delete',
          'farmer.create', 'farmer.view',
          'collection.create', 'collection.view',
          'batch.create', 'batch.view', 'batch.dispatch',
        ],
      };
      return next();
    }

    // Village Admin mock: scoped permissions only
    if (token === 'mock-jwt-token-village') {
      req.user = {
        userId: 'dev-village-admin',
        roleId: 'VILLAGE_ADMIN',
        organizationId: 'dev-org',
        facilityId: null,
        permissions: [
          'collection.view', 'collection.create',
          'farmer.view', 'farmer.create',
          'facility.view',
          'batch.view', 'batch.create',
        ],
      };
      return next();
    }

    // Verify token
    const decoded = jwt.verify(token, getJwtSecret()) as any;

    // Attach to request
    req.user = {
      userId: decoded.userId,
      roleId: decoded.roleId,
      organizationId: decoded.organizationId,
      facilityId: decoded.facilityId,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    console.error('Auth Error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const requirePermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Super Admin bypass (Super Admins have 'system.view' which gives them god mode)
      if (req.user.permissions.includes('system.view')) {
        return next();
      }

      // Check if user has the specific permission string
      if (!req.user.permissions.includes(requiredPermission)) {
        return res.status(403).json({ 
          error: 'Forbidden: Insufficient permissions',
          required: requiredPermission 
        });
      }

      next();
    } catch (error) {
      console.error('Permission Error:', error);
      return res.status(500).json({ error: 'Internal Server Error during authorization' });
    }
  };
};

export const requireScope = (
  entityOrgId?: string, 
  entityFacilityId?: string | null
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Super Admin bypass (assuming empty permissions means full access, or check for specific role)
      if (req.user.permissions.includes('system.view')) {
        return next();
      }

      // Check Organization match
      if (entityOrgId && req.user.organizationId !== entityOrgId) {
        return res.status(403).json({ error: 'Forbidden: Outside of organizational scope' });
      }

      // Check Facility match (if applicable to user)
      if (req.user.facilityId && entityFacilityId && req.user.facilityId !== entityFacilityId) {
        return res.status(403).json({ error: 'Forbidden: Outside of facility scope' });
      }

      next();
    } catch (error) {
      return res.status(500).json({ error: 'Scope Authorization Error' });
    }
  };
};
