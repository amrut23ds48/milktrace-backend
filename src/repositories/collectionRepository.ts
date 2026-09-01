import { PrismaClient, MilkCollection } from '../generated/prisma/client';
import { CreateCollectionInput } from '../types/collection.types';
import { prisma } from '../lib/prisma';

export async function createCollection(input: CreateCollectionInput): Promise<MilkCollection> {
  return await prisma.milkCollection.create({
    data: {
      collection_code: input.collection_code,
      farmer_id: input.farmer_id,
      facility_id: input.facility_id,
      operator_id: input.operator_id,
      session: input.session,
      quantity_liters: input.quantity_liters,
      collection_timestamp: new Date(input.collection_timestamp),
      quality_measurements: input.quality ? {
        create: {
          fat_percent: input.quality.fat_percent,
          snf_percent: input.quality.snf_percent,
          density: input.quality.density,
          temperature: input.quality.temperature,
          water_estimate: input.quality.water_estimate,
        }
      } : undefined
    },
    include: {
      quality_measurements: true
    }
  });
}

export async function findAllCollections(): Promise<MilkCollection[]> {
  return await prisma.milkCollection.findMany({
    orderBy: { collection_timestamp: 'desc' },
    include: {
      farmer: { select: { id: true, name: true, farmer_code: true } },
      facility: { select: { id: true, name: true, type: true } },
      operator: { select: { id: true, name: true } },
      quality_measurements: true
    }
  });
}
