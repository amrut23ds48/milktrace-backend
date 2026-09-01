import { CreateCollectionInput, CollectionResponse } from '../types/collection.types';
import { createCollection, findAllCollections } from '../repositories/collectionRepository';
import { NotFoundError, ValidationError } from '../lib/errors';
import { findFarmerById } from '../repositories/farmerRepository';
import { findFacilityById } from '../repositories/facilityRepository';
import { FarmerRegistrationStatus } from '../generated/prisma/client';

export async function recordCollection(input: CreateCollectionInput): Promise<CollectionResponse> {
  if (input.quantity_liters <= 0) {
    throw new ValidationError('Quantity must be greater than 0');
  }
  if (!input.farmer_id) {
    throw new ValidationError('farmer_id is required');
  }
  if (!input.facility_id) {
    throw new ValidationError('facility_id is required');
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

  return mapCollectionToResponse(collection);
}

export async function getCollections(): Promise<CollectionResponse[]> {
  const collections = await findAllCollections();
  return collections.map(c => mapCollectionToResponse(c));
}

function mapCollectionToResponse(c: any): CollectionResponse {
  return {
    id: c.id,
    collection_code: c.collection_code,
    farmer_id: c.farmer_id,
    facility_id: c.facility_id,
    operator_id: c.operator_id,
    session: c.session as CollectionResponse['session'],
    quantity_liters: Number(c.quantity_liters),
    collection_timestamp: c.collection_timestamp,
    status: c.status,
    created_at: c.created_at,
    updated_at: c.updated_at,
    farmer: c.farmer,
    facility: c.facility,
    operator: c.operator,
    quality_measurements: c.quality_measurements?.map((qm: any) => ({
      fat_percent: qm.fat_percent ? Number(qm.fat_percent) : null,
      snf_percent: qm.snf_percent ? Number(qm.snf_percent) : null,
      density: qm.density ? Number(qm.density) : null,
      temperature: qm.temperature ? Number(qm.temperature) : null,
      water_estimate: qm.water_estimate ? Number(qm.water_estimate) : null,
    }))
  };
}

