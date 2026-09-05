import { PrismaClient, MilkCollection, Prisma } from '../generated/prisma/client';
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

export async function findAllCollections(opts?: { date?: string; session?: 'MORNING' | 'EVENING'; status?: string }): Promise<MilkCollection[]> {
  const where: Prisma.MilkCollectionWhereInput = {};
  if (opts?.date) {
    // Parse date as UTC day range (avoids IST/UTC drift where setHours would use local tz)
    const start = new Date(`${opts.date}T00:00:00.000Z`);
    const end = new Date(`${opts.date}T23:59:59.999Z`);
    where.collection_timestamp = { gte: start, lte: end };
  }
  if (opts?.session) {
    where.session = opts.session;
  }
  if (opts?.status) {
    where.status = opts.status as any; // EntityStatus
  }

  return await prisma.milkCollection.findMany({
    where,
    orderBy: { collection_timestamp: 'desc' },
    include: {
      farmer: { select: { id: true, name: true, farmer_code: true } },
      facility: { select: { id: true, name: true, type: true } },
      operator: { select: { id: true, name: true } },
      quality_measurements: true
    }
  });
}

export async function findCollectionsByFacility(facilityId: string, opts?: { date?: string; session?: 'MORNING' | 'EVENING'; status?: string }): Promise<MilkCollection[]> {
  const where: Prisma.MilkCollectionWhereInput = { facility_id: facilityId };
  if (opts?.date) {
    const start = new Date(`${opts.date}T00:00:00.000Z`);
    const end = new Date(`${opts.date}T23:59:59.999Z`);
    where.collection_timestamp = { gte: start, lte: end };
  }
  if (opts?.session) {
    where.session = opts.session;
  }
  if (opts?.status) {
    where.status = opts.status as any; // EntityStatus
  }
  
  return await prisma.milkCollection.findMany({
    where,
    orderBy: { collection_timestamp: 'desc' },
    include: {
      farmer: { select: { id: true, name: true, farmer_code: true } },
      facility: { select: { id: true, name: true, type: true } },
      operator: { select: { id: true, name: true } },
      quality_measurements: true
    }
  });
}

export async function findCollectionById(id: string) {
  return await prisma.milkCollection.findUnique({
    where: { id },
    include: {
      farmer: { select: { id: true, name: true, farmer_code: true } },
      facility: { select: { id: true, name: true, type: true } },
      operator: { select: { id: true, name: true } },
      quality_measurements: true
    }
  });
}

export async function findDailySummaryByFacility(facilityId: string, date: string) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  
  const collections = await prisma.milkCollection.findMany({
    where: { 
      facility_id: facilityId,
      collection_timestamp: { gte: start, lte: end },
      status: 'ACTIVE'
    },
    include: {
      quality_measurements: true
    }
  });

  let totalLiters = 0;
  let morningLiters = 0;
  let eveningLiters = 0;
  let totalFatMass = 0;
  let totalSnfMass = 0;
  let volumeWithQuality = 0;
  const farmers = new Set<string>();
  
  for (const c of collections) {
    totalLiters += Number(c.quantity_liters);
    farmers.add(c.farmer_id);
    if (c.session === 'MORNING') morningLiters += Number(c.quantity_liters);
    if (c.session === 'EVENING') eveningLiters += Number(c.quantity_liters);
    
    if (c.quality_measurements && c.quality_measurements.length > 0) {
      const q = c.quality_measurements[0];
      if (q.fat_percent && q.snf_percent) {
        totalFatMass += Number(c.quantity_liters) * Number(q.fat_percent);
        totalSnfMass += Number(c.quantity_liters) * Number(q.snf_percent);
        volumeWithQuality += Number(c.quantity_liters);
      }
    }
  }

  return {
    totalLiters,
    farmerCount: farmers.size,
    morningLiters,
    eveningLiters,
    avgFat: volumeWithQuality > 0 ? (totalFatMass / volumeWithQuality) : null,
    avgSnf: volumeWithQuality > 0 ? (totalSnfMass / volumeWithQuality) : null,
  };
}

export async function cancelCollection(id: string, reason: string, actorId: string) {
  const existing = await prisma.milkCollection.findUnique({ where: { id } });
  if (!existing) throw new Error("Not found");
  
  const hoursSinceCreation = (new Date().getTime() - existing.created_at.getTime()) / (1000 * 60 * 60);
  if (hoursSinceCreation > 24) {
    throw new Error("Cannot cancel collection after 24 hours");
  }
  
  return await prisma.$transaction(async (tx) => {
    const updated = await tx.milkCollection.update({
      where: { id },
      data: { status: 'SUSPENDED' }
    });
    
    await tx.auditLog.create({
      data: {
        actor_user_id: actorId,
        action: 'CANCEL',
        entity_type: 'MILK_COLLECTION',
        entity_id: id,
        new_values: { reason }
      }
    });
    
    return updated;
  });
}
