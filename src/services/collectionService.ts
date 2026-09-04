import { CreateCollectionInput, CollectionResponse } from '../types/collection.types';
import { createCollection, findAllCollections, findCollectionsByFacility, findCollectionById, findDailySummaryByFacility, cancelCollection as repoCancelCollection } from '../repositories/collectionRepository';
import { calculateExpectedQuality, evaluateQualityRisk } from './anomalyEngine';
import { prisma } from '../lib/prisma';
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

  // Background Anomaly Check
  if (input.quality && input.quality.fat_percent && input.quality.snf_percent) {
    (async () => {
      try {
        const animals = await prisma.animal.findMany({ where: { farmer_id: input.farmer_id } });
        const animalInputs = animals.map(a => ({
          volume: Number(a.expected_daily_yield) || 0,
          fat: Number(a.expected_fat) || 0,
          snf: Number(a.expected_snf) || 0
        }));
        
        const expected = calculateExpectedQuality(animalInputs);
        if (expected.totalVolume > 0) {
          const risk = evaluateQualityRisk(expected, input.quality!.fat_percent!, input.quality!.snf_percent!);
          
          if (risk.riskScore > 0) {
            await prisma.anomalyEvent.create({
              data: {
                anomaly_type: 'QUALITY_DROP',
                severity: risk.riskLevel === 'CRITICAL' ? 'CRITICAL' : risk.riskLevel === 'HIGH' ? 'HIGH' : risk.riskLevel === 'MEDIUM' ? 'MEDIUM' : 'LOW',
                risk_score: risk.riskScore,
                entity_type: 'MILK_COLLECTION',
                entity_id: collection.id,
                status: 'ACTIVE',
                details: { message: `Quality deviation: ${risk.flags.join(', ')}` }
              }
            });
          }
        }
      } catch (err) {
        console.error('Failed to run anomaly engine on collection', collection.id, err);
      }
    })();
  }

  return mapCollectionToResponse(collection);
}

export async function getCollectionsByFacility(facilityId: string, opts?: { date?: string; session?: 'MORNING' | 'EVENING'; status?: string }): Promise<CollectionResponse[]> {
  const collections = await findCollectionsByFacility(facilityId, opts);
  return collections.map(c => mapCollectionToResponse(c));
}

export async function getCollectionById(id: string): Promise<CollectionResponse | null> {
  const c = await findCollectionById(id);
  return c ? mapCollectionToResponse(c) : null;
}

export async function getDailySummary(facilityId: string, date: string) {
  return await findDailySummaryByFacility(facilityId, date);
}

export async function cancelCollection(id: string, reason: string, actorId: string) {
  const c = await repoCancelCollection(id, reason, actorId);
  return mapCollectionToResponse(c);
}

export async function getCollections(opts?: { date?: string; session?: 'MORNING' | 'EVENING'; status?: string }): Promise<CollectionResponse[]> {
  const collections = await findAllCollections(opts);
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

