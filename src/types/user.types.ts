import { OrganizationType, EntityStatus, FacilityType } from '../generated/prisma/client';

// ─── User Types ───────────────────────────────────────────────────────────────

/** Input shape for creating a new user (from the API request body). */
export interface CreateUserInput {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  organizationId: string;
  roleId: string;
  facilityId?: string;
}

/**
 * A User safe to return from the API — password_hash is structurally excluded.
 * This type is enforced at compile time; it is impossible to accidentally include
 * password_hash in an API response when this type is used.
 */
export interface SafeUser {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: EntityStatus;
  organization_id: string;
  role_id: string;
  facility_id: string | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// Re-export enums for convenience in tests / services
export { OrganizationType, EntityStatus, FacilityType };
