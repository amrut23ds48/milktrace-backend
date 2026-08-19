import { batchRepository } from '../repositories/batchRepository';
import { MilkCollection } from '../generated/prisma/client';
import { CreateBatchRequest } from '../types/batch.types';
import { ValidationError, NotFoundError } from '../lib/errors';
import { prisma } from '../lib/prisma';

export class BatchService {
  async createBatch(data: CreateBatchRequest) {
    if (!data.collection_ids || data.collection_ids.length === 0) {
      throw new ValidationError('At least one collection ID must be provided');
    }

    // 1. Fetch collections to validate they exist and belong to the source facility
    const collections = await prisma.milkCollection.findMany({
      where: { id: { in: data.collection_ids } }
    });

    if (collections.length !== data.collection_ids.length) {
      const foundIds = collections.map((c: MilkCollection) => c.id);
      const missing = data.collection_ids.filter(id => !foundIds.includes(id));
      throw new NotFoundError(`Collections not found: ${missing.join(', ')}`);
    }

    // 2. Ensure all collections belong to the source facility
    const invalidCollections = collections.filter((c: MilkCollection) => c.facility_id !== data.source_facility_id);
    if (invalidCollections.length > 0) {
      throw new ValidationError('Some collections do not belong to source facility');
    }

    // 3. Ensure collections aren't already part of a batch
    // Based on requirements, if they are already in batch_items, they shouldn't be added again
    const existingItems = await prisma.batchItem.findMany({
      where: { collection_id: { in: data.collection_ids } }
    });
    
    if (existingItems.length > 0) {
      throw new ValidationError('Some collections are already assigned to a batch');
    }

    // 4. Calculate total quantity
    // quantity_liters is stored as Decimal, so we must sum as floats
    const totalQuantity = collections.reduce((acc: number, c: MilkCollection) => acc + Number(c.quantity_liters), 0);

    // 5. Create the batch
    return batchRepository.createBatch(data, totalQuantity);
  }
}

export const batchService = new BatchService();
