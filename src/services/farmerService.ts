import { CreateFarmerInput, FarmerResponse } from '../types/farmer.types';
import { createFarmer, findFarmerByCode } from '../repositories/farmerRepository';
import { ConflictError, ValidationError } from '../lib/errors';
import { findFacilityById } from '../repositories/facilityRepository';

export async function registerFarmer(input: CreateFarmerInput): Promise<FarmerResponse> {
  if (!input.farmer_code || !input.name || !input.collection_center_id) {
    throw new ValidationError('farmer_code, name, and collection_center_id are required');
  }

  const existingFarmer = await findFarmerByCode(input.farmer_code);
  if (existingFarmer) {
    throw new ConflictError(`Farmer with code ${input.farmer_code} already exists`);
  }

  const facility = await findFacilityById(input.collection_center_id);
  if (!facility) {
    throw new ValidationError(`Collection center with id ${input.collection_center_id} not found`);
  }

  const farmer = await createFarmer(input);

  return {
    id: farmer.id,
    farmer_code: farmer.farmer_code,
    name: farmer.name,
    phone: farmer.phone,
    village: farmer.village,
    district: farmer.district,
    registration_status: farmer.registration_status,
    collection_center_id: farmer.collection_center_id,
    created_at: farmer.created_at,
    updated_at: farmer.updated_at,
  };
}
