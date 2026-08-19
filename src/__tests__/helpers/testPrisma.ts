import 'dotenv/config';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// ─── Test Prisma Client ───────────────────────────────────────────────────────
// A dedicated PrismaClient for tests — separate from the production singleton.
// Tests use database transactions that are rolled back after each test,
// keeping the local DB clean without requiring a separate test database.

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const testPrisma = new PrismaClient({ adapter });

/**
 * Disconnect the test client after the test suite completes.
 * Call this in afterAll() of every test file.
 */
export async function disconnectTestPrisma(): Promise<void> {
  await testPrisma.$disconnect();
}

/**
 * Seed a minimal Organization + Role required as FK prerequisites for User/Facility tests.
 * Returns the created org id and role id for use in test data.
 */
export async function seedOrgAndRole(): Promise<{ orgId: string; roleId: string }> {
  const org = await testPrisma.organization.create({
    data: {
      name: 'Test Cooperative',
      type: 'COOPERATIVE',
      status: 'ACTIVE',
    },
  });

  const role = await testPrisma.role.create({
    data: {
      name: 'VILLAGE_ADMIN',
      is_system_role: true,
      organization_id: org.id,
    },
  });

  return { orgId: org.id, roleId: role.id };
}

export async function seedFacility(orgId: string) {
  return await testPrisma.facility.create({
    data: {
      organization_id: orgId,
      name: 'Test Village Center',
      type: 'VILLAGE_COLLECTION_CENTER',
      district: 'Pune',
      status: 'ACTIVE',
    },
  });
}

/**
 * Clean up test rows by IDs to keep tests isolated.
 * Call this in afterEach() / afterAll() within test files.
 */
export async function cleanupUsers(ids: string[]): Promise<void> {
  await testPrisma.user.deleteMany({ where: { id: { in: ids } } });
}

export async function cleanupFacilities(ids?: string[]): Promise<void> {
  if (ids) {
    await testPrisma.facility.deleteMany({ where: { id: { in: ids } } });
  } else {
    await testPrisma.facility.deleteMany();
  }
}

export async function cleanupAll(): Promise<void> {
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
}

export async function cleanupFarmers(ids?: string[]): Promise<void> {
  if (ids) {
    await testPrisma.farmer.deleteMany({ where: { id: { in: ids } } });
  } else {
    // If we delete all farmers, we need to delete collections first
    await testPrisma.milkCollection.deleteMany();
    await testPrisma.farmer.deleteMany();
  }
}

export async function cleanupOrgs(ids?: string[]): Promise<void> {
  if (ids) {
    await testPrisma.transfer.deleteMany({ where: { source_facility: { organization_id: { in: ids } } } });
    await testPrisma.batchItem.deleteMany({ where: { batch: { source_facility: { organization_id: { in: ids } } } } });
    await testPrisma.batch.deleteMany({ where: { source_facility: { organization_id: { in: ids } } } });
    await testPrisma.qualityMeasurement.deleteMany({ where: { collection: { facility: { organization_id: { in: ids } } } } });
    await testPrisma.milkCollection.deleteMany({ where: { facility: { organization_id: { in: ids } } } });
    await testPrisma.animal.deleteMany({ where: { farmer: { collection_center: { organization_id: { in: ids } } } } });
    await testPrisma.farmer.deleteMany({ where: { collection_center: { organization_id: { in: ids } } } });
    await testPrisma.user.deleteMany({ where: { organization_id: { in: ids } } });
    await testPrisma.facility.deleteMany({ where: { organization_id: { in: ids } } });
    await testPrisma.role.deleteMany({ where: { organization_id: { in: ids } } });
    await testPrisma.organization.deleteMany({ where: { id: { in: ids } } });
  } else {
    await cleanupAll();
  }
}
