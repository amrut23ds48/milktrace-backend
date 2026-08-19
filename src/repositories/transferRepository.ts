import { Transfer } from '../generated/prisma/client';
import { CreateTransferRequest } from '../types/transfer.types';
import { prisma } from '../lib/prisma';

export class TransferRepository {
  /**
   * Creates a transfer and updates the associated batch status within a transaction.
   */
  async createTransfer(data: CreateTransferRequest): Promise<Transfer> {
    return prisma.$transaction(async (tx: any) => {
      // 1. Create the Transfer
      const transfer = await tx.transfer.create({
        data: {
          batch_id: data.batch_id,
          source_facility_id: data.source_facility_id,
          destination_facility_id: data.destination_facility_id,
          dispatched_quantity: data.dispatched_quantity,
          status: 'DISPATCHED',
          vehicle_number: data.vehicle_number,
          driver_name: data.driver_name
        }
      });

      // 2. Update the Batch status
      await tx.batch.update({
        where: { id: data.batch_id },
        data: {
          status: 'DISPATCHED',
          dispatched_at: new Date()
        }
      });

      return transfer;
    });
  }

  async findTransferById(id: string) {
    return prisma.transfer.findUnique({
      where: { id },
      include: {
        batch: true,
        source_facility: true,
        destination_facility: true
      }
    });
  }
}

export const transferRepository = new TransferRepository();
