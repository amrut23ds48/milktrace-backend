import { EntityStatus, FacilityType } from '../generated/prisma/client';

// ─── Facility Types ───────────────────────────────────────────────────────────

/** Shape returned by the facility API endpoints. */
export interface FacilityResponse {
  id: string;
  name: string;
  type: FacilityType;
  district: string;
  taluka: string | null;
  village: string | null;
  latitude: string | null; // Prisma returns Decimal as string in JSON
  longitude: string | null;
  status: EntityStatus;
  organization_id: string;
  parent_facility_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export { FacilityType, EntityStatus };
