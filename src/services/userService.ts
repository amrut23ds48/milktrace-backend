import { createUser as repoCreateUser, findUserByEmail, findAllUsers, updateUser as repoUpdateUser } from '../repositories/userRepository';
import { ValidationError, ConflictError } from '../lib/errors';
import { CreateUserInput, SafeUser } from '../types/user.types';
import { supabaseAdmin } from '../lib/supabaseAdmin';
import bcrypt from 'bcrypt';

// ─── User Service ─────────────────────────────────────────────────────────────
// Contains all business logic for user management.
// This layer is HTTP-unaware — no req/res objects here.

/**
 * Validates input, checks for duplicate email, hashes the password,
 * and creates a new user via the repository.
 *
 * Throws:
 *   - ValidationError (400) if required fields are missing or invalid
 *   - ConflictError (409) if email is already registered
 */
export async function createUser(input: CreateUserInput): Promise<SafeUser> {
  // ── Validation ────────────────────────────────────────────────────────────
  if (!input.name?.trim()) {
    throw new ValidationError('name is required');
  }
  if (!input.organizationId?.trim()) {
    throw new ValidationError('organizationId is required');
  }
  if (!input.roleId?.trim()) {
    throw new ValidationError('roleId is required');
  }

  // ── Duplicate email check ─────────────────────────────────────────────────
  if (input.email) {
    const existing = await findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError(`A user with email '${input.email}' already exists`);
    }
  }

  // ── Password: required for new users ─────────────────────────────────────
  if (!input.password?.trim()) {
    throw new ValidationError('password is required to create a user');
  }
  if (input.password.length < 8) {
    throw new ValidationError('password must be at least 8 characters');
  }

  // ── Step 1: Create user in Supabase Auth (the source of truth for login) ──
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: input.email!,
    password: input.password,
    email_confirm: true, // auto-confirm so they can log in immediately
  });

  if (authError) {
    // Surface Supabase errors (e.g. email already taken in auth.users)
    throw new ConflictError(`Supabase Auth: ${authError.message}`);
  }

  const supabaseUid = authData.user.id;

  // ── Step 2: Hash password for local JWT login path ─────────────────────────
  const password_hash = await bcrypt.hash(input.password, 10);

  // ── Step 3: Persist to our users table using the Supabase Auth UID ─────────
  return repoCreateUser({
    id: supabaseUid,  // Sync the Prisma user ID with Supabase Auth UID
    name: input.name.trim(),
    email: input.email,
    phone: input.phone,
    organizationId: input.organizationId,
    roleId: input.roleId,
    facilityId: input.facilityId,
    password_hash,
  });
}

export async function getUsers(): Promise<SafeUser[]> {
  return findAllUsers();
}

export async function updateUser(id: string, data: any): Promise<SafeUser> {
  return repoUpdateUser(id, data);
}

export async function deleteUser(id: string): Promise<SafeUser> {
  return repoUpdateUser(id, { status: 'SUSPENDED' });
}
