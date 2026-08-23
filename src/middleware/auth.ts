import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Secret from environment or fallback for dev
const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
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
