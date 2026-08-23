import { prisma } from '../lib/prisma';
import { EntityStatus } from '../generated/prisma/client';
import { NotFoundError, ValidationError } from '../lib/errors';

export async function approveBusiness(businessId: string, documents: any[]) {
  if (!documents || documents.length === 0) {
    throw new ValidationError('Valid GST/Registration documents required');
  }

  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) {
    throw new NotFoundError(`Business with id ${businessId} not found`);
  }

  const updated = await prisma.business.update({
    where: { id: businessId },
    data: { status: EntityStatus.ACTIVE }
  });

  return updated;
}
