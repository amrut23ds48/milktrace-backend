import bcrypt from 'bcrypt';
import { createUser as repoCreateUser, findUserByEmail } from '../repositories/userRepository';
import { ValidationError, ConflictError } from '../lib/errors';
import { CreateUserInput, SafeUser } from '../types/user.types';

// ─── User Service ─────────────────────────────────────────────────────────────
// Contains all business logic for user management.
// This layer is HTTP-unaware — no req/res objects here.

const BCRYPT_SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

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
  if (!input.password) {
    throw new ValidationError('password is required');
  }
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(
      `password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    );
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

  // ── Password hashing ──────────────────────────────────────────────────────
  const password_hash = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

  // ── Persist ───────────────────────────────────────────────────────────────
  return repoCreateUser({
    name: input.name.trim(),
    email: input.email,
    phone: input.phone,
    password_hash,
    organizationId: input.organizationId,
    roleId: input.roleId,
    facilityId: input.facilityId,
  });
}
