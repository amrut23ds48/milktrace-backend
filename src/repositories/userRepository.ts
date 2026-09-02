import { prisma } from '../lib/prisma';
import { SafeUser } from '../types/user.types';

// ─── User Repository ──────────────────────────────────────────────────────────
// The ONLY layer that directly queries the `users` table.
// All queries go through the shared Prisma client.

/**
 * Input for creating a user. password_hash must already be computed
 * by the service layer before this is called.
 */
export interface CreateUserData {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  organizationId: string;
  roleId: string;
  facilityId?: string;
}

/** Select clause that explicitly excludes password_hash from query results. */
const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  organization_id: true,
  role_id: true,
  facility_id: true,
  last_login_at: true,
  created_at: true,
  updated_at: true,
} as const;

/**
 * Persists a new user record and returns the safe (no password_hash) representation.
 */
export async function createUser(data: CreateUserData): Promise<SafeUser> {
  let orgId = data.organizationId;
  if (orgId === '1' || !orgId.includes('-')) {
    const org = await prisma.organization.findFirst();
    if (org) orgId = org.id;
  }

  return prisma.user.create({
    data: {
      id: data.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      organization_id: orgId,
      role_id: data.roleId,
      facility_id: data.facilityId || null,
    },
    select: safeUserSelect,
  });
}

export async function updateUser(id: string, data: Partial<CreateUserData> & { status?: 'ACTIVE' | 'SUSPENDED' }): Promise<SafeUser> {
  return prisma.user.update({
    where: { id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
      role_id: data.roleId,
      facility_id: data.facilityId || null,
      status: data.status,
    },
    select: safeUserSelect,
  });
}

/**
 * Finds a user by email address. Used to check for duplicates before creation.
 * Returns null if no user exists with that email.
 */
export async function findUserByEmail(email: string): Promise<{ id: string } | null> {
  return prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });
}

/**
 * Fetches all users securely without password hashes,
 * including their role and facility metadata.
 */
export async function findAllUsers(): Promise<SafeUser[]> {
  return prisma.user.findMany({
    select: {
      ...safeUserSelect,
      role: true,
      facility: true,
    },
    orderBy: { created_at: 'desc' },
  });
}
