import { prisma } from '../lib/prisma';
import { InvestigationStatus, EntityStatus } from '../generated/prisma/client';
import { NotFoundError, ValidationError } from '../lib/errors';

export async function closeInvestigation(investigationId: string, input: { conclusion?: string }) {
  if (!input.conclusion || input.conclusion.trim() === '') {
    throw new ValidationError('Conclusion text is required');
  }

  const investigation = await prisma.investigation.findUnique({
    where: { id: investigationId },
    include: { anomaly: true }
  });

  if (!investigation) {
    throw new NotFoundError(`Investigation with id ${investigationId} not found`);
  }

  // Update investigation and parent anomaly in a transaction
  const [updatedInvestigation, updatedAnomaly] = await prisma.$transaction([
    prisma.investigation.update({
      where: { id: investigationId },
      data: { 
        status: InvestigationStatus.RESOLVED,
        conclusion: input.conclusion
      }
    }),
    prisma.anomalyEvent.update({
      where: { id: investigation.anomaly_id },
      data: { status: EntityStatus.CANCELLED } // Mark as CANCELLED (resolved/archived)
    })
  ]);

  return { investigation: updatedInvestigation, anomaly: updatedAnomaly };
}
