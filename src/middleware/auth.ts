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
    
    // Dev bypass: auto-login as Super Admin from the real database
    if (token === 'mock-jwt-token') {
      const superAdmin = await prisma.user.findFirst({
        where: { role: { name: 'Super Admin' } },
        include: { role: { include: { permissions: true } } }
      });
      if (superAdmin) {
        req.user = {
          userId: superAdmin.id,
          roleId: superAdmin.role_id,
          organizationId: superAdmin.organization_id,
          facilityId: superAdmin.facility_id,
          permissions: superAdmin.role.permissions.map((rp: any) => rp.permission?.code ?? rp.permission),
        };
      } else {
        // Fallback if no super admin found
        req.user = {
          userId: 'dev-super-admin',
          roleId: 'SUPER_ADMIN',
          organizationId: 'dev-org',
          facilityId: null,
          permissions: ['system.view', 'collection.view', 'collection.create', 'farmer.view', 'farmer.create', 'batch.view', 'batch.create', 'facility.view', 'facility.create', 'user.view', 'user.create', 'role.view', 'role.create'],
        };
      }
      return next();
    }

    // Dev bypass: auto-login as Village Admin from the real database
    if (token === 'mock-jwt-token-village') {
      const villageAdmin = await prisma.user.findFirst({
        where: { role: { name: 'Village Admin' } },
        include: { role: { include: { permissions: true } } }
      });
      if (villageAdmin) {
        req.user = {
          userId: villageAdmin.id,
          roleId: villageAdmin.role_id,
          organizationId: villageAdmin.organization_id,
          facilityId: villageAdmin.facility_id,
          permissions: villageAdmin.role.permissions.map((rp: any) => rp.permission?.code ?? rp.permission),
        };
      } else {
        req.user = {
          userId: 'dev-village-admin',
          roleId: 'VILLAGE_ADMIN',
          organizationId: 'dev-org',
          facilityId: null,
          permissions: ['collection.view', 'collection.create', 'farmer.view', 'farmer.create', 'facility.view'],
        };
      }
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
