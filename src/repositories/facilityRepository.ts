import { prisma } from '../lib/prisma';
import { Facility } from '../generated/prisma/client';

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
