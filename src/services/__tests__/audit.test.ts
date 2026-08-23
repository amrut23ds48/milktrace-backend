import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { testPrisma } from '../../__tests__/helpers/testPrisma';
import { batchService } from '../batchService';
import { updateFacility } from '../facilityService';

describe('Audit Logging System', () => {
  let batchId: string;
  let facilityId: string;

  beforeAll(async () => {
    const org = await testPrisma.organization.create({
      data: { name: 'Audit Org', type: 'COOPERATIVE', status: 'ACTIVE' }
    });
    const facility = await testPrisma.facility.create({
      data: { name: 'Audit Facility', type: 'VILLAGE_COLLECTION_CENTER', district: 'Pune', organization_id: org.id }
    });
    facilityId = facility.id;

    const batch = await testPrisma.batch.create({
      data: { source_facility_id: facility.id, quantity_liters: 100 }
    });
    batchId = batch.id;
  });

  afterAll(async () => {
    await testPrisma.auditLog.deleteMany();
    await testPrisma.batchItem.deleteMany();
    await testPrisma.batch.deleteMany();
    await testPrisma.facility.deleteMany();
    await testPrisma.organization.deleteMany();
  });

  it('should automatically generate an AuditLog entry when a Batch is dispatched', async () => {
    await batchService.dispatchBatch(batchId);
    
    const auditLogs = await testPrisma.auditLog.findMany({
      where: { entity_type: 'Batch', entity_id: batchId, action: 'DISPATCH' }
    });
    expect(auditLogs.length).toBe(1);
  });

  it('should store both old_values and new_values in the AuditLog when a Facility is updated', async () => {
    await updateFacility(facilityId, { name: 'New Audit Facility' });

    const auditLogs = await testPrisma.auditLog.findMany({
      where: { entity_type: 'Facility', entity_id: facilityId, action: 'UPDATE' },
      orderBy: { created_at: 'desc' }
    });
    expect(auditLogs.length).toBeGreaterThan(0);
    expect(auditLogs[0].new_values).toHaveProperty('name', 'New Audit Facility');
    expect(auditLogs[0].old_values).toHaveProperty('name', 'Audit Facility');
  });
});
