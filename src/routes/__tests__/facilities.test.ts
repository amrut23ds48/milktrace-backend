import request from 'supertest';
import app from '../../app';
import {
  testPrisma,
  seedOrgAndRole,
  cleanupFacilities,
  cleanupOrgs,
  disconnectTestPrisma,
} from '../../__tests__/helpers/testPrisma';
import { FacilityType } from '../../types/facility.types';

// ─── GET /api/v1/facilities/:id ───────────────────────────────────────────────
// Integration tests for facility fetch. Written BEFORE implementation (TDD Red phase).

describe('GET /api/v1/facilities/:id', () => {
  let orgId: string;
  let facilityId: string;
  const createdOrgIds: string[] = [];
  const createdFacilityIds: string[] = [];

  beforeAll(async () => {
    const seed = await seedOrgAndRole();
    orgId = seed.orgId;
    createdOrgIds.push(orgId);

    // Seed a test facility directly via Prisma
    const facility = await testPrisma.facility.create({
      data: {
        name: 'Village Center Test',
        type: FacilityType.VILLAGE_COLLECTION_CENTER,
        district: 'Pune',
        taluka: 'Haveli',
        village: 'Uruli Kanchan',
        status: 'ACTIVE',
        organization_id: orgId,
      },
    });

    facilityId = facility.id;
    createdFacilityIds.push(facilityId);
  });

  afterAll(async () => {
    await cleanupFacilities(createdFacilityIds);
    await cleanupOrgs(createdOrgIds);
    await disconnectTestPrisma();
  });

  it('should return 200 with the facility when a valid id is provided', async () => {
    const res = await request(app).get(`/api/v1/facilities/${facilityId}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: facilityId,
      name: 'Village Center Test',
      type: 'VILLAGE_COLLECTION_CENTER',
      district: 'Pune',
      organization_id: orgId,
      status: 'ACTIVE',
    });
  });

  it('should return 404 when facility does not exist', async () => {
    const nonExistentId = '00000000-0000-4000-a000-000000000000';
    const res = await request(app).get(`/api/v1/facilities/${nonExistentId}`);

    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({
      error: true,
      code: 'NOT_FOUND',
    });
  });

  it('should return 400 when id is not a valid UUID', async () => {
    const res = await request(app).get('/api/v1/facilities/not-a-valid-uuid');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      error: true,
      code: 'VALIDATION_ERROR',
    });
  });
});
