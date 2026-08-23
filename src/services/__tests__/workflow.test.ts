import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { testPrisma } from '../../__tests__/helpers/testPrisma';
import { approveFarmer, suspendFarmer } from '../farmerService';
import { recordCollection } from '../collectionService';
import { closeInvestigation } from '../investigationService';
import { FarmerRegistrationStatus, InvestigationStatus, EntityStatus } from '../../generated/prisma/client';

describe('System Workflows (Services Layer)', () => {
  let farmerId: string;
  let facilityId: string;
  let orgId: string;
  let anomalyId: string;
  let investigationId: string;

  beforeAll(async () => {
    const org = await testPrisma.organization.create({
      data: { name: 'Workflow Org', type: 'COOPERATIVE', status: 'ACTIVE' }
    });
    orgId = org.id;

    const facility = await testPrisma.facility.create({
      data: { name: 'Workflow Facility', type: 'VILLAGE_COLLECTION_CENTER', district: 'Pune', organization_id: org.id }
    });
    facilityId = facility.id;

    const farmer = await testPrisma.farmer.create({
      data: {
        farmer_code: 'WF-1', name: 'WF Farmer', collection_center_id: facility.id, registration_status: 'PENDING'
      }
    });
    farmerId = farmer.id;

    const anomaly = await testPrisma.anomalyEvent.create({
      data: {
        anomaly_type: 'TEST', severity: 'LOW', risk_score: 10, entity_type: 'FARMER', entity_id: farmer.id
      }
    });
    anomalyId = anomaly.id;

    const investigation = await testPrisma.investigation.create({
      data: { anomaly_id: anomaly.id }
    });
    investigationId = investigation.id;
  });

  afterAll(async () => {
    await testPrisma.investigation.deleteMany();
    await testPrisma.anomalyEvent.deleteMany();
    await testPrisma.milkCollection.deleteMany();
    await testPrisma.farmer.deleteMany();
    await testPrisma.facility.deleteMany();
    await testPrisma.organization.deleteMany();
  });

  describe('Farmer Approval Workflow', () => {
    it('should transition a farmer from PENDING to APPROVED', async () => {
      const farmer = await approveFarmer(farmerId);
      expect(farmer.registration_status).toBe(FarmerRegistrationStatus.APPROVED);
    });

    it('should throw an error if attempting to collect milk from a SUSPENDED farmer', async () => {
      await suspendFarmer(farmerId, 'Fraud');
      
      await expect(recordCollection({
        collection_code: 'COL-123',
        farmer_id: farmerId,
        facility_id: facilityId,
        operator_id: orgId, // Mock ID, doesn't matter since validation throws first
        session: 'MORNING',
        quantity_liters: 10,
        collection_timestamp: new Date()
      })).rejects.toThrow('Cannot collect from suspended farmer');
    });
  });

  describe('Investigation & Dispute Closure', () => {
    it('should fail to close an investigation if conclusion text is missing', async () => {
      await expect(closeInvestigation(investigationId, { conclusion: '' }))
        .rejects.toThrow('Conclusion text is required');
    });

    it('should automatically mark the parent AnomalyEvent as CANCELLED when closing an investigation', async () => {
      const res = await closeInvestigation(investigationId, { conclusion: 'All good' });
      expect(res.investigation.status).toBe(InvestigationStatus.RESOLVED);
      expect(res.anomaly.status).toBe(EntityStatus.CANCELLED);
    });
  });
});
