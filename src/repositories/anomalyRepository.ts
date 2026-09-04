import { prisma } from '../lib/prisma';

export interface AnomalyFilters {
  status?: string;
  severity?: string;
  entity_type?: string;
  page?: number;
  limit?: number;
}

export async function findAnomalies(filters: AnomalyFilters = {}) {
  const { status, severity, entity_type, page = 1, limit = 10 } = filters;

  const where: Record<string, unknown> = {};
  if (status && status !== 'ALL') {
    // DB uses ACTIVE/INACTIVE; map front-end OPEN → ACTIVE, RESOLVED → INACTIVE
    if (status === 'OPEN') where.status = 'ACTIVE';
    else if (status === 'RESOLVED') where.status = 'INACTIVE';
    else if (status === 'INVESTIGATING') where.status = 'INVESTIGATING';
  }
  if (severity && severity !== 'ALL') where.severity = severity;
  if (entity_type && entity_type !== 'ALL') where.entity_type = entity_type;

  const [total, anomalies] = await Promise.all([
    prisma.anomalyEvent.count({ where }),
    prisma.anomalyEvent.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { investigations: { include: { investigator: { select: { name: true, id: true } } } } },
    }),
  ]);

  // Enrich each anomaly with a human-readable location label
  const enriched = await Promise.all(anomalies.map(async (a) => {
    let locationLabel = `${a.entity_type}: ${a.entity_id}`;
    let district: string | null = null;

    if (a.entity_type === 'TRANSFER') {
      const transfer = await prisma.transfer.findUnique({
        where: { id: a.entity_id },
        include: { source_facility: true, destination_facility: true },
      });
      if (transfer) {
        locationLabel = `${transfer.source_facility.name} → ${transfer.destination_facility.name}`;
        district = transfer.source_facility.district;
      }
    } else if (a.entity_type === 'FACILITY') {
      const facility = await prisma.facility.findUnique({ where: { id: a.entity_id } });
      if (facility) {
        locationLabel = `${facility.name} (${facility.district})`;
        district = facility.district;
      }
    } else if (a.entity_type === 'BATCH') {
      const batch = await prisma.batch.findUnique({
        where: { id: a.entity_id },
        include: { source_facility: true, destination_facility: true },
      });
      if (batch) {
        locationLabel = batch.destination_facility
          ? `Batch: ${batch.source_facility.name} → ${batch.destination_facility.name}`
          : `Batch from ${batch.source_facility.name}`;
        district = batch.source_facility.district;
      }
    }

    const activeInvestigation = a.investigations.find(i => i.status !== 'RESOLVED');
    const resolvedInvestigation = a.investigations.find(i => i.status === 'RESOLVED');

    return {
      id: a.id,
      type: a.anomaly_type,
      entityType: a.entity_type,
      entityId: a.entity_id,
      locationLabel,
      district,
      severity: a.severity,
      riskScore: a.risk_score,
      detectedAt: a.created_at.toISOString(),
      // Derive front-end status
      status: a.investigations.some(i => i.status === 'RESOLVED')
        ? 'RESOLVED'
        : a.investigations.some(i => i.status !== 'RESOLVED' && i.status !== 'NEW')
          ? 'INVESTIGATING'
          : a.status === 'ACTIVE' ? 'OPEN' : 'RESOLVED',
      assignedTo: activeInvestigation?.investigator?.name ?? null,
      assignedToId: activeInvestigation?.assigned_to ?? null,
      investigationId: activeInvestigation?.id ?? resolvedInvestigation?.id ?? null,
      conclusion: resolvedInvestigation?.conclusion ?? null,
    };
  }));

  return { data: enriched, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// Backwards-compatible alias used by dashboardService
export async function findAllAnomalies() {
  const result = await findAnomalies({ limit: 100 });
  return result.data;
}
