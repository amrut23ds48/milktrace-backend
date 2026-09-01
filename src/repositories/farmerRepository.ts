import { PrismaClient, Farmer, FarmerRegistrationStatus } from '../generated/prisma/client';
import { CreateFarmerInput } from '../types/farmer.types';
import { prisma } from '../lib/prisma';

export async function createFarmer(input: CreateFarmerInput): Promise<Farmer> {
  return await prisma.farmer.create({
    data: {
      farmer_code: input.farmer_code,
      name: input.name,
      phone: input.phone,
      aadhar_number: input.aadhar_number,
      village: input.village,
      district: input.district,
      collection_center_id: input.collection_center_id,
      registration_status: 'PENDING',
      animals: input.animals && input.animals.length > 0 ? {
        create: input.animals
      } : undefined
    },
    include: {
      animals: true
    }
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
    include: { animals: true }
  });
}

export async function updateFarmerStatus(id: string, status: FarmerRegistrationStatus): Promise<Farmer> {
  return await prisma.farmer.update({
    where: { id },
    data: { registration_status: status },
  });
}

export async function findAllFarmers(): Promise<Farmer[]> {
  return await prisma.farmer.findMany({
    orderBy: { created_at: 'desc' },
    include: { animals: true }
  });
}
export async function updateFarmer(id: string, data: any): Promise<Farmer> {
  const { animals, ...farmerData } = data;

  // 1. Update basic farmer details
  await prisma.farmer.update({
    where: { id },
    data: farmerData,
  });

  // 2. Handle nested animals array
  if (animals && Array.isArray(animals)) {
    const existingAnimals = await prisma.animal.findMany({ where: { farmer_id: id } });
    const incomingIds = animals.map((a: any) => a.id).filter(Boolean);

    // Delete animals that were removed from the form
    const toDelete = existingAnimals.filter(ea => !incomingIds.includes(ea.id));
    if (toDelete.length > 0) {
      await prisma.animal.deleteMany({ where: { id: { in: toDelete.map(a => a.id) } } });
    }

    // Upsert remaining animals
    for (const animal of animals) {
      if (animal.id) {
        await prisma.animal.update({
          where: { id: animal.id },
          data: {
            identifier: animal.identifier,
            species: animal.species,
            breed: animal.breed,
            approximate_age: animal.approximate_age,
            sex: animal.sex || 'FEMALE'
          }
        });
      } else {
        await prisma.animal.create({
          data: {
            farmer_id: id,
            identifier: animal.identifier,
            species: animal.species,
            breed: animal.breed,
            approximate_age: animal.approximate_age,
            sex: animal.sex || 'FEMALE'
          }
        });
      }
    }
  }

  // 3. Return fresh data
  return await prisma.farmer.findUnique({
    where: { id },
    include: { animals: true }
  }) as Farmer;
}
