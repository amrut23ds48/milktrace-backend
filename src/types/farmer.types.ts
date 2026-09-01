import { FarmerRegistrationStatus } from '../generated/prisma/client';

export interface CreateFarmerInput {
  farmer_code: string;
  name: string;
  phone?: string;
  aadhar_number?: string;
  village?: string;
  district?: string;
  collection_center_id: string;
  animals?: {
    identifier: string;
    species: string;
    breed?: string;
    sex: string;
    approximate_age?: number;
  }[];
}

export interface FarmerResponse {
  id: string;
  farmer_code: string;
  name: string;
  phone: string | null;
  aadhar_number: string | null;
  village: string | null;
  district: string | null;
  registration_status: FarmerRegistrationStatus;
  collection_center_id: string;
  created_at: Date;
  updated_at: Date;
  animals?: any[];
}
