import request from 'supertest';
import app from '../../app';
import {
  seedOrgAndRole,
  seedFacility,
  cleanupFacilities,
  cleanupOrgs,
  cleanupFarmers,
  disconnectTestPrisma,
  testPrisma
} from '../../__tests__/helpers/testPrisma';
import { hash } from 'bcrypt';

// ─── POST /api/v1/collections ──────────────────────────────────────────────────
// Integration tests for milk collections.

describe('Milk Collection Routes', () => {
  let facilityId: string;
  let farmerId: string;
  let operatorId: string;
  let orgIdMain: string;

  beforeAll(async () => {
    const { orgId, roleId } = await seedOrgAndRole();
    orgIdMain = orgId;
    const facility = await seedFacility(orgId);
    facilityId = facility.id;

    // Create Operator User
    const hashed = await hash('password123', 10);
    const user = await testPrisma.user.create({
      data: {
        name: 'Test Operator',
        organization_id: orgId,
        role_id: roleId,
        facility_id: facilityId,
        password_hash: hashed,
      }
    });
    operatorId = user.id;

    // Create Farmer
    const farmer = await testPrisma.farmer.create({
      data: {
        farmer_code: 'F-COL-1001',
        name: 'Test Farmer',
        collection_center_id: facilityId,
      }
    });
    farmerId = farmer.id;
  });

  afterAll(async () => {
    await testPrisma.milkCollection.deleteMany();
    await cleanupFarmers();
    await testPrisma.user.deleteMany();
    await cleanupFacilities();
    await cleanupOrgs();
    await disconnectTestPrisma();
  });

  describe('POST /api/v1/collections', () => {
    it('should record a collection and return 201', async () => {
      const payload = {
        collection_code: 'C-2001',
        farmer_id: farmerId,
        facility_id: facilityId,
        operator_id: operatorId,
        session: 'MORNING',
        quantity_liters: 15.5,
        collection_timestamp: new Date().toISOString(),
      };

      const response = await request(app).post('/api/v1/collections').send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.collection_code).toBe('C-2001');
      expect(Number(response.body.quantity_liters)).toBe(15.5);
    });

    it('should return 400 when quantity is zero or negative', async () => {
      const payload = {
        collection_code: 'C-2002',
        farmer_id: farmerId,
        facility_id: facilityId,
        operator_id: operatorId,
        session: 'EVENING',
        quantity_liters: 0,
        collection_timestamp: new Date().toISOString(),
      };

      const response = await request(app).post('/api/v1/collections').send(payload);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Quantity must be greater than 0');
    });

    it('should return 404 when farmer does not exist', async () => {
      const payload = {
        collection_code: 'C-2003',
        farmer_id: '00000000-0000-0000-0000-000000000000',
        facility_id: facilityId,
        operator_id: operatorId,
        session: 'MORNING',
        quantity_liters: 10,
        collection_timestamp: new Date().toISOString(),
      };

      const response = await request(app).post('/api/v1/collections').send(payload);

      expect(response.status).toBe(404);
      expect(response.body.message).toContain('Farmer');
    });
  });
});
