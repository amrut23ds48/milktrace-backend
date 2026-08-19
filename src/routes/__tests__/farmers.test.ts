import request from 'supertest';
import app from '../../app';
import {
  seedOrgAndRole,
  seedFacility,
  cleanupFacilities,
  cleanupOrgs,
  cleanupFarmers,
  disconnectTestPrisma,
} from '../../__tests__/helpers/testPrisma';

// ─── POST /api/v1/farmers ─────────────────────────────────────────────────────
// Integration tests for farmer registration. Written BEFORE implementation.

describe('Farmer Routes', () => {
  let facilityId: string;

  beforeAll(async () => {
    // We need a valid collection center to register a farmer.
    const { orgId } = await seedOrgAndRole();
    const facility = await seedFacility(orgId);
    facilityId = facility.id;
  });

  afterAll(async () => {
    await cleanupFarmers();
    await cleanupFacilities();
    await cleanupOrgs();
    await disconnectTestPrisma();
  });

  describe('POST /api/v1/farmers', () => {
    it('should create a farmer and return 201 with farmer data', async () => {
      const payload = {
        farmer_code: 'F-1001',
        name: 'Tukaram Patil',
        phone: '9876543210',
        village: 'Shirwal',
        district: 'Satara',
        collection_center_id: facilityId,
      };

      const response = await request(app).post('/api/v1/farmers').send(payload);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.farmer_code).toBe('F-1001');
      expect(response.body.name).toBe('Tukaram Patil');
      expect(response.body.registration_status).toBe('PENDING');
      expect(response.body.collection_center_id).toBe(facilityId);
    });

    it('should return 400 when required fields are missing', async () => {
      const payload = {
        name: 'Namdev',
        // missing farmer_code and collection_center_id
      };

      const response = await request(app).post('/api/v1/farmers').send(payload);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toContain('farmer_code');
    });

    it('should return 409 when farmer_code already exists', async () => {
      // Trying to create another farmer with the same code F-1001
      const payload = {
        farmer_code: 'F-1001',
        name: 'Another Farmer',
        collection_center_id: facilityId,
      };

      const response = await request(app).post('/api/v1/farmers').send(payload);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', true);
      expect(response.body.message).toContain('already exists');
    });
  });
});
