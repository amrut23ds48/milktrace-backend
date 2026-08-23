import request from 'supertest';
import app from '../../app';
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { testPrisma } from '../../__tests__/helpers/testPrisma';
import bcrypt from 'bcrypt';
import { generateTestToken } from '../../__tests__/helpers/auth';

describe('Batch Routes', () => {
  let token: string;
  let sourceFacilityId: string;
  let destFacilityId: string;
  let collection1Id: string;
  let collection2Id: string;

  beforeAll(async () => {
    // 1. Create Org and Role
    const org = await testPrisma.organization.create({
      data: { name: 'Test Org', type: 'COOPERATIVE', status: 'ACTIVE' }
    });

    const role = await testPrisma.role.create({
      data: { name: 'Admin', organization_id: org.id }
    });

    // 2. Create source and destination facilities
    const sourceFacility = await testPrisma.facility.create({
      data: {
        organization_id: org.id,
        name: 'Test Source Chilling Center',
        type: 'CHILLING_CENTER',
        district: 'Pune'
      }
    });
    sourceFacilityId = sourceFacility.id;

    const destFacility = await testPrisma.facility.create({
      data: {
        organization_id: org.id,
        name: 'Test Dest Processing Plant',
        type: 'PROCESSING_PLANT',
        district: 'Pune'
      }
    });
    destFacilityId = destFacility.id;

    // 3. Create User
    const rawPassword = 'password123';
    const hash = await bcrypt.hash(rawPassword, 10);
    const user = await testPrisma.user.create({
      data: {
        organization_id: org.id,
        role_id: role.id,
        name: 'Test User',
        email: `user_${Date.now()}@test.com`,
        password_hash: hash,
      }
    });

    // 4. Create a Farmer and some MilkCollections
    const farmer = await testPrisma.farmer.create({
      data: {
        farmer_code: `F-${Date.now()}`,
        name: 'Test Farmer',
        collection_center_id: sourceFacility.id
      }
    });

    const col1 = await testPrisma.milkCollection.create({
      data: {
        collection_code: `C1-${Date.now()}`,
        farmer_id: farmer.id,
        facility_id: sourceFacility.id,
        operator_id: user.id,
        session: 'MORNING',
        quantity_liters: 100,
        collection_timestamp: new Date()
      }
    });
    collection1Id = col1.id;

    const col2 = await testPrisma.milkCollection.create({
      data: {
        collection_code: `C2-${Date.now()}`,
        farmer_id: farmer.id,
        facility_id: sourceFacility.id,
        operator_id: user.id,
        session: 'EVENING',
        quantity_liters: 150,
        collection_timestamp: new Date()
      }
    });
    collection2Id = col2.id;
  });

  describe('POST /api/v1/batches', () => {
    it('should create a new batch and link collections', async () => {
      const token = generateTestToken('SUPER_ADMIN');
      const res = await request(app)
        .post('/api/v1/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({
          source_facility_id: sourceFacilityId,
          destination_facility_id: destFacilityId,
          collection_ids: [collection1Id, collection2Id]
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.quantity_liters).toBe('250'); // 100 + 150
      expect(res.body.data.status).toBe('CREATED');
      expect(res.body.data.items).toHaveLength(2);
      expect(res.body.data.items[0].collection_id).toBe(collection1Id);
    });

    it('should fail if a collection does not exist', async () => {
      const token = generateTestToken('SUPER_ADMIN');
      const res = await request(app)
        .post('/api/v1/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({
          source_facility_id: sourceFacilityId,
          collection_ids: ['00000000-0000-0000-0000-000000000000']
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe(true);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should fail if collection does not belong to source facility', async () => {
      // Find the user from db to use as operator
      const user = await testPrisma.user.findFirst();
      if (!user) throw new Error('User not found');

      // Create a collection in another facility
      const otherFacility = await testPrisma.facility.create({
        data: {
          organization_id: user.organization_id,
          name: 'Other Facility',
          type: 'VILLAGE_COLLECTION_CENTER',
          district: 'Pune'
        }
      });

      const otherFarmer = await testPrisma.farmer.create({
        data: {
          farmer_code: `F2-${Date.now()}`,
          name: 'Other Farmer',
          collection_center_id: otherFacility.id
        }
      });

      const otherCol = await testPrisma.milkCollection.create({
        data: {
          collection_code: `C3-${Date.now()}`,
          farmer_id: otherFarmer.id,
          facility_id: otherFacility.id, 
          operator_id: user.id, 
          session: 'MORNING',
          quantity_liters: 50,
          collection_timestamp: new Date()
        }
      });

      const token = generateTestToken('SUPER_ADMIN');
      const res = await request(app)
        .post('/api/v1/batches')
        .set('Authorization', `Bearer ${token}`)
        .send({
          source_facility_id: sourceFacilityId,
          collection_ids: [otherCol.id]
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(true);
      expect(res.body.message).toMatch(/do not belong to source facility/i);
    });
  });

  afterAll(async () => {
    // We can use cleanupAll from the helpers, but I didn't import it. Let me just use it
    await testPrisma.transfer.deleteMany();
    await testPrisma.batchItem.deleteMany();
    await testPrisma.batch.deleteMany();
    await testPrisma.qualityMeasurement.deleteMany();
    await testPrisma.milkCollection.deleteMany();
    await testPrisma.animal.deleteMany();
    await testPrisma.farmer.deleteMany();
    await testPrisma.user.deleteMany();
    await testPrisma.facility.deleteMany();
    await testPrisma.role.deleteMany();
    await testPrisma.organization.deleteMany();
    await testPrisma.$disconnect();
  });
});
