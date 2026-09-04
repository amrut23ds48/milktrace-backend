import { Batch, BatchItem } from '../generated/prisma/client';
import { CreateBatchRequest } from '../types/batch.types';
import { prisma } from '../lib/prisma';

export class BatchRepository {
  /**
   * Creates a batch and links the given collection IDs within a transaction.
   * Assumes validation (like checking if collections exist and belong to the source)
   * has already been done by the service layer.
   */
  async createBatch(
    data: CreateBatchRequest,
    totalQuantity: number
  ): Promise<Batch & { items: BatchItem[] }> {
    return prisma.$transaction(async (tx: any) => {
      // 1. Create the Batch
      const batch = await tx.batch.create({
        data: {
          source_facility_id: data.source_facility_id,
          destination_facility_id: data.destination_facility_id,
          quantity_liters: totalQuantity,
          status: 'CREATED'
        }
      });

      // 2. Fetch the collections to get their individual quantities
      const collections = await tx.milkCollection.findMany({
        where: { id: { in: data.collection_ids } },
        select: { id: true, quantity_liters: true }
      });

      // 3. Create the BatchItems linking collections to the batch
      const batchItemsData = collections.map((c: any) => ({
        batch_id: batch.id,
        collection_id: c.id,
        quantity_liters: c.quantity_liters
      }));

      await tx.batchItem.createMany({
        data: batchItemsData
      });

      // Return the batch with items
      return tx.batch.findUniqueOrThrow({
        where: { id: batch.id },
        include: { items: true }
      });
    });
  }

  async findBatchById(id: string) {
    return prisma.batch.findUnique({
      where: { id },
      include: {
        items: true,
        source_facility: true,
        destination_facility: true
      }
    });
  }

  async getAllBatches() {
    return prisma.batch.findMany({
      include: { 
        items: true,
        source_facility: { select: { name: true, type: true } },
        destination_facility: { select: { name: true, type: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }
}

export const batchRepository = new BatchRepository();
