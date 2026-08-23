import { PrismaClient, Farmer, FarmerRegistrationStatus } from '../generated/prisma/client';
import { CreateFarmerInput } from '../types/farmer.types';
import { prisma } from '../lib/prisma';

export async function createFarmer(input: CreateFarmerInput): Promise<Farmer> {
  return await prisma.farmer.create({
    data: {
      farmer_code: input.farmer_code,
      name: input.name,
      phone: input.phone,
      village: input.village,
      district: input.district,
      collection_center_id: input.collection_center_id,
      registration_status: 'PENDING',
    },
  });
}

export async function findFarmerByCode(code: string): Promise<Farmer | null> {
  return await prisma.farmer.findUnique({
    where: { farmer_code: code },
  });
}

export async function findFarmerById(id: string): Promise<Farmer | null> {
  return await prisma.farmer.findUnique({
    where: { id },
  });
}

export async function updateFarmerStatus(id: string, status: FarmerRegistrationStatus): Promise<Farmer> {
  return await prisma.farmer.update({
    where: { id },
    data: { registration_status: status },
  });
}

