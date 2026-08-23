import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        roleId: string;
        organizationId: string;
        facilityId: string | null;
        permissions: string[];
      };
    }
  }
}
