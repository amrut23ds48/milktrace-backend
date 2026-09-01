import { prisma } from '../lib/prisma';
import { Animal } from '../generated/prisma/client';
import { UpdateAnimalBaselinesInput } from '../types/animal.types';

export async function findAllAnimals(): Promise<Animal[]> {
  return await prisma.animal.findMany({
    orderBy: { created_at: 'desc' },
    include: {
      farmer: {
        select: {
          id: true,
          farmer_code: true,
          name: true,
          collection_center_id: true,
        }
      }
    }
  });
}

export async function findAnimalById(id: string): Promise<Animal | null> {
  return await prisma.animal.findUnique({
    where: { id },
    include: {
      farmer: {
        select: {
          id: true,
          farmer_code: true,
          name: true,
          collection_center_id: true,
        }
      }
    }
  });
}

export async function updateAnimalBaselines(id: string, data: UpdateAnimalBaselinesInput): Promise<Animal> {
  return await prisma.animal.update({
    where: { id },
    data: {
      expected_daily_yield: data.expected_daily_yield,
      expected_fat: data.expected_fat,
      expected_snf: data.expected_snf,
    },
    include: {
      farmer: {
        select: {
          id: true,
          farmer_code: true,
          name: true,
          collection_center_id: true,
        }
      }
    }
  });
}
