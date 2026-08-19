import { transferRepository } from '../repositories/transferRepository';
import { CreateTransferRequest } from '../types/transfer.types';
import { ValidationError, NotFoundError } from '../lib/errors';
import { prisma } from '../lib/prisma';

export class TransferService {
  async createTransfer(data: CreateTransferRequest) {
    // 1. Fetch batch to validate it exists
    const batch = await prisma.batch.findUnique({
      where: { id: data.batch_id }
    });

    if (!batch) {
      throw new NotFoundError(`Batch not found`);
    }

    // 2. Validate batch is in CREATED status
    if (batch.status !== 'CREATED') {
      throw new ValidationError(`Batch is not in CREATED status`);
    }

    // 3. Ensure source facility matches the batch
    if (batch.source_facility_id !== data.source_facility_id) {
      throw new ValidationError(`Source facility does not match batch source facility`);
    }

    // 4. Ensure destination is either matching batch or provided
    const destinationId = data.destination_facility_id || batch.destination_facility_id;
    if (!destinationId) {
      throw new ValidationError(`Destination facility must be provided`);
    }

    // 5. Create the transfer and update batch status
    return transferRepository.createTransfer({
      ...data,
      destination_facility_id: destinationId
    });
  }
}

export const transferService = new TransferService();
