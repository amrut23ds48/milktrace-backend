import { CreateCollectionInput, CollectionResponse } from '../types/collection.types';
import { createCollection } from '../repositories/collectionRepository';
import { NotFoundError, ValidationError } from '../lib/errors';
import { findFarmerById } from '../repositories/farmerRepository';
import { findFacilityById } from '../repositories/facilityRepository';
import { FarmerRegistrationStatus } from '../generated/prisma/client';

export async function recordCollection(input: CreateCollectionInput): Promise<CollectionResponse> {
  if (input.quantity_liters <= 0) {
    throw new ValidationError('Quantity must be greater than 0');
  }

  const farmer = await findFarmerById(input.farmer_id);
  if (!farmer) {
    throw new NotFoundError(`Farmer with id ${input.farmer_id} not found`);
  }
  
  if (farmer.registration_status === FarmerRegistrationStatus.SUSPENDED) {
    throw new ValidationError('Cannot collect from suspended farmer');
  }
  if (farmer.registration_status === FarmerRegistrationStatus.PENDING) {
    throw new ValidationError('Cannot collect from pending farmer');
  }

  const facility = await findFacilityById(input.facility_id);
  if (!facility) {
    throw new NotFoundError(`Facility with id ${input.facility_id} not found`);
  }

  const collection = await createCollection(input);

  return {
    id: collection.id,
    collection_code: collection.collection_code,
    farmer_id: collection.farmer_id,
    facility_id: collection.facility_id,
    operator_id: collection.operator_id,
    session: collection.session,
    quantity_liters: Number(collection.quantity_liters),
    collection_timestamp: collection.collection_timestamp,
    status: collection.status,
    created_at: collection.created_at,
    updated_at: collection.updated_at,
  };
}
