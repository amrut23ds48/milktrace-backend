import request from 'supertest';
import app from '../../app';
import { testPrisma } from '../../__tests__/helpers/testPrisma';
import bcrypt from 'bcrypt';

describe('Transfer Routes', () => {
  let sourceFacilityId: string;
  let destFacilityId: string;
  let batchId: string;

  beforeAll(async () => {
    // 1. Create Org and Role
    const org = await testPrisma.organization.create({
      data: { name: 'Test Org 2', type: 'COOPERATIVE', status: 'ACTIVE' }
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
        email: `user2_${Date.now()}@test.com`,
        password_hash: hash,
      }
    });

    // 4. Create a Batch
    const batch = await testPrisma.batch.create({
      data: {
        source_facility_id: sourceFacility.id,
        destination_facility_id: destFacility.id,
        quantity_liters: 250,
        status: 'CREATED'
      }
    });
    batchId = batch.id;
  });

  describe('POST /api/v1/transfers', () => {
    it('should create a new transfer and update batch status', async () => {
      const res = await request(app)
        .post('/api/v1/transfers')
        .send({
          batch_id: batchId,
          source_facility_id: sourceFacilityId,
          destination_facility_id: destFacilityId,
          dispatched_quantity: 250,
          vehicle_number: 'MH-12-AB-1234',
          driver_name: 'John Doe'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.dispatched_quantity).toBe('250');
      expect(res.body.data.status).toBe('DISPATCHED');
      expect(res.body.data.vehicle_number).toBe('MH-12-AB-1234');

      // Verify batch status was updated to DISPATCHED
      const updatedBatch = await testPrisma.batch.findUnique({ where: { id: batchId } });
      expect(updatedBatch?.status).toBe('DISPATCHED');
    });

    it('should fail if batch does not exist', async () => {
      const res = await request(app)
        .post('/api/v1/transfers')
        .send({
          batch_id: '00000000-0000-0000-0000-000000000000',
          source_facility_id: sourceFacilityId,
          destination_facility_id: destFacilityId,
          dispatched_quantity: 250
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe(true);
      expect(res.body.message).toMatch(/not found/i);
    });

    it('should fail if batch is already dispatched', async () => {
      // Re-dispatching the same batch should fail
      const res = await request(app)
        .post('/api/v1/transfers')
        .send({
          batch_id: batchId,
          source_facility_id: sourceFacilityId,
          destination_facility_id: destFacilityId,
          dispatched_quantity: 250
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe(true);
      expect(res.body.message).toMatch(/batch is not in CREATED status/i);
    });
  });

  afterAll(async () => {
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
