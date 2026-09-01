import { prisma } from '../lib/prisma';
import { Facility, FacilityType } from '../generated/prisma/client';

// ─── Facility Repository ──────────────────────────────────────────────────────
// The ONLY layer that directly queries the `facilities` table.

/**
 * Finds a facility by its UUID primary key.
 * Returns null if the facility does not exist.
 */
export async function findFacilityById(id: string): Promise<Facility | null> {
  return prisma.facility.findUnique({
    where: { id },
  });
}

export async function findAllFacilities(): Promise<Facility[]> {
  return prisma.facility.findMany({
    orderBy: { created_at: 'desc' },
  });
}

export async function createFacility(data: {
  name: string;
  type: FacilityType;
  district: string;
  organization_id: string;
  latitude?: number;
  longitude?: number;
}): Promise<Facility> {
  let orgId = data.organization_id;
  if (orgId === '1' || !orgId.includes('-')) {
    const org = await prisma.organization.findFirst();
    if (org) orgId = org.id;
  }

  return prisma.facility.create({
    data: {
      ...data,
      organization_id: orgId
    }
  });
}
