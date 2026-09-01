import { CreateFarmerInput, FarmerResponse } from '../types/farmer.types';
import { createFarmer, findFarmerByCode, findFarmerById, updateFarmerStatus, findAllFarmers, updateFarmer as repoUpdateFarmer } from '../repositories/farmerRepository';
import { ConflictError, ValidationError, NotFoundError } from '../lib/errors';
import { findFacilityById } from '../repositories/facilityRepository';
import { FarmerRegistrationStatus } from '../generated/prisma/client';

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
    aadhar_number: farmer.aadhar_number,
    village: farmer.village,
    district: farmer.district,
    registration_status: farmer.registration_status,
    collection_center_id: farmer.collection_center_id,
    created_at: farmer.created_at,
    updated_at: farmer.updated_at,
    animals: (farmer as any).animals,
  };
}

export async function approveFarmer(farmerId: string): Promise<FarmerResponse> {
  const farmer = await findFarmerById(farmerId);
  if (!farmer) throw new NotFoundError(`Farmer with id ${farmerId} not found`);

  const updated = await updateFarmerStatus(farmerId, FarmerRegistrationStatus.APPROVED);

  return {
    id: updated.id,
    farmer_code: updated.farmer_code,
    name: updated.name,
    phone: updated.phone,
    aadhar_number: updated.aadhar_number,
    village: updated.village,
    district: updated.district,
    registration_status: updated.registration_status,
    collection_center_id: updated.collection_center_id,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
    animals: (updated as any).animals,
  };
}

export async function suspendFarmer(farmerId: string, reason?: string): Promise<FarmerResponse> {
  const farmer = await findFarmerById(farmerId);
  if (!farmer) throw new NotFoundError(`Farmer with id ${farmerId} not found`);

  const updated = await updateFarmerStatus(farmerId, FarmerRegistrationStatus.SUSPENDED);

  return {
    id: updated.id,
    farmer_code: updated.farmer_code,
    name: updated.name,
    phone: updated.phone,
    aadhar_number: updated.aadhar_number,
    village: updated.village,
    district: updated.district,
    registration_status: updated.registration_status,
    collection_center_id: updated.collection_center_id,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
    animals: (updated as any).animals,
  };
}

export async function getFarmers(): Promise<FarmerResponse[]> {
  const farmers = await findAllFarmers();
  return farmers.map(f => ({
    id: f.id,
    farmer_code: f.farmer_code,
    name: f.name,
    phone: f.phone,
    aadhar_number: f.aadhar_number,
    village: f.village,
    district: f.district,
    registration_status: f.registration_status,
    collection_center_id: f.collection_center_id,
    created_at: f.created_at,
    updated_at: f.updated_at,
    animals: (f as any).animals,
  }));
}

export async function updateFarmer(id: string, data: any): Promise<FarmerResponse> {
  const farmer = await findFarmerById(id);
  if (!farmer) throw new NotFoundError('Farmer', id);

  const updated = await repoUpdateFarmer(id, data);
  return {
    id: updated.id,
    farmer_code: updated.farmer_code,
    name: updated.name,
    phone: updated.phone,
    aadhar_number: updated.aadhar_number,
    village: updated.village,
    district: updated.district,
    registration_status: updated.registration_status,
    collection_center_id: updated.collection_center_id,
    created_at: updated.created_at,
    updated_at: updated.updated_at,
    animals: (updated as any).animals,
  };
}

export async function deleteFarmer(id: string): Promise<FarmerResponse> {
  return suspendFarmer(id);
}
