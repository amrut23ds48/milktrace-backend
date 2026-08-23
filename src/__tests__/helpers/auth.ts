import 'dotenv/config';
import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';

export const generateTestToken = (roleName: string, orgId: string = 'org-1', facilityId: string | null = null) => {
  const permissions = [];
  
  if (roleName === 'SUPER_ADMIN') {
    permissions.push('system.view', 'user.create', 'farmer.create', 'facility.create', 'collection.create', 'batch.create', 'transfer.create');
  } else if (roleName === 'VILLAGE_ADMIN') {
    permissions.push('collection.create', 'batch.create');
  } else if (roleName === 'CHILLING_ADMIN') {
    permissions.push('batch.create', 'transfer.create');
  }

  return jwt.sign({
    userId: 'mock-user-id',
    roleId: `role-${roleName}`,
    organizationId: orgId,
    facilityId: facilityId,
    permissions
  }, getJwtSecret(), { expiresIn: '1h' });
};
