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
  });
}

export async function findAllCollections(): Promise<MilkCollection[]> {
  return await prisma.milkCollection.findMany({
    orderBy: { collection_timestamp: 'desc' }
  });
}
