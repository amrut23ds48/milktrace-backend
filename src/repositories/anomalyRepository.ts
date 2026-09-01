import { prisma } from '../lib/prisma';
import { AnomalyEvent } from '../generated/prisma/client';

export async function findAllAnomalies(): Promise<AnomalyEvent[]> {
  return prisma.anomalyEvent.findMany({
    orderBy: { created_at: 'desc' }
  });
}
