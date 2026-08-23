import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { testPrisma } from '../../__tests__/helpers/testPrisma';
import { approveBusiness } from '../businessService';
import { EntityStatus } from '../../generated/prisma/client';

describe('Business Module', () => {
  let businessId: string;

  beforeAll(async () => {
    const org = await testPrisma.organization.create({
      data: { name: 'Biz Org', type: 'BUSINESS', status: 'ACTIVE' }
    });
    const biz = await testPrisma.business.create({
      data: { organization_id: org.id, name: 'Biz', business_type: 'RETAILER', status: 'SUSPENDED' }
    });
    businessId = biz.id;
  });

  afterAll(async () => {
    await testPrisma.business.deleteMany();
    await testPrisma.organization.deleteMany();
  });

  it('should require valid GST/Registration documents before approving a Business', async () => {
    await expect(approveBusiness(businessId, []))
      .rejects.toThrow('Valid GST/Registration documents required');
    
    const business = await approveBusiness(businessId, [{ type: 'GST', id: '123' }]);
    expect(business.status).toBe(EntityStatus.ACTIVE);
  });
});
