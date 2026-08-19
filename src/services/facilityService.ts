import { findFacilityById } from '../repositories/facilityRepository';
import { NotFoundError, ValidationError } from '../lib/errors';
import { FacilityResponse } from '../types/facility.types';

// ─── Facility Service ─────────────────────────────────────────────────────────
// Contains all business logic for facility operations.
// This layer is HTTP-unaware — no req/res objects here.

/** Simple UUID v4 regex for format validation. */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validates the UUID format, fetches the facility from the repository,
 * and throws appropriate typed errors if not valid or not found.
 *
 * Throws:
 *   - ValidationError (400) if id is not a valid UUID
 *   - NotFoundError (404) if no facility exists with that id
 */
export async function getFacility(id: string): Promise<FacilityResponse> {
  if (!UUID_REGEX.test(id)) {
    throw new ValidationError(`'${id}' is not a valid facility id (expected UUID v4)`);
  }

  const facility = await findFacilityById(id);

  if (!facility) {
    throw new NotFoundError('Facility', id);
  }

  // Serialize Decimal lat/lng as strings for JSON (Prisma Decimal is not natively JSON-safe)
  return {
    ...facility,
    latitude: facility.latitude?.toString() ?? null,
    longitude: facility.longitude?.toString() ?? null,
  };
}
