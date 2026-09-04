import { prisma } from '../lib/prisma';

// ─── Helper: get start date from period string ────────────────────────────────
function getStartDate(period: string): Date {
  const days = { '7D': 7, '30D': 30, '90D': 90 }[period] ?? 30;
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── 1. Volume Trend ──────────────────────────────────────────────────────────
export async function getVolumeTrend(period = '30D', district?: string) {
  const since = getStartDate(period);

  // Collections grouped by day
  const collections = await prisma.milkCollection.findMany({
    where: {
      collection_timestamp: { gte: since },
      ...(district && district !== 'ALL'
        ? { facility: { district } }
        : {}),
    },
    include: { facility: { select: { district: true } } },
    orderBy: { collection_timestamp: 'asc' },
  });

  // Transfers grouped by day
  const transfers = await prisma.transfer.findMany({
    where: {
      dispatched_at: { gte: since },
      ...(district && district !== 'ALL'
        ? { source_facility: { district } }
        : {}),
    },
    orderBy: { dispatched_at: 'asc' },
  });

  // Build a day-keyed map
  const dayMap: Record<string, { collected: number; dispatched: number; received: number }> = {};

  for (const c of collections) {
    const day = c.collection_timestamp.toISOString().slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { collected: 0, dispatched: 0, received: 0 };
    dayMap[day].collected += Number(c.quantity_liters);
  }

  for (const t of transfers) {
    const day = t.dispatched_at.toISOString().slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { collected: 0, dispatched: 0, received: 0 };
    dayMap[day].dispatched += Number(t.dispatched_quantity);
    if (t.received_quantity) dayMap[day].received += Number(t.received_quantity);
  }

  return Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }));
}

// ─── 2. Loss Rate ─────────────────────────────────────────────────────────────
export async function getLossRate(period = '30D', district?: string) {
  const since = getStartDate(period);

  const transfers = await prisma.transfer.findMany({
    where: {
      dispatched_at: { gte: since },
      received_quantity: { not: null },
      ...(district && district !== 'ALL'
        ? { source_facility: { district } }
        : {}),
    },
    orderBy: { dispatched_at: 'asc' },
  });

  const dayMap: Record<string, { dispatched: number; received: number }> = {};

  for (const t of transfers) {
    const day = t.dispatched_at.toISOString().slice(0, 10);
    if (!dayMap[day]) dayMap[day] = { dispatched: 0, received: 0 };
    dayMap[day].dispatched += Number(t.dispatched_quantity);
    dayMap[day].received += Number(t.received_quantity ?? 0);
  }

  return Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { dispatched, received }]) => {
      const diff = dispatched - received;
      const lossPercent = diff > 0 ? (diff / dispatched) * 100 : 0;
      const spikePercent = diff < 0 ? (Math.abs(diff) / dispatched) * 100 : 0;
      return { date, lossPercent: Number(lossPercent.toFixed(2)), spikePercent: Number(spikePercent.toFixed(2)) };
    });
}

// ─── 3. Anomaly Breakdown ─────────────────────────────────────────────────────
export async function getAnomalyBreakdown(period = '30D') {
  const since = getStartDate(period);

  const anomalies = await prisma.anomalyEvent.findMany({
    where: { created_at: { gte: since } },
    select: { anomaly_type: true, severity: true },
  });

  // Group by type
  const typeMap: Record<string, { count: number; severity: string }> = {};
  for (const a of anomalies) {
    if (!typeMap[a.anomaly_type]) typeMap[a.anomaly_type] = { count: 0, severity: a.severity };
    typeMap[a.anomaly_type].count++;
  }

  // Group by severity
  const sevMap: Record<string, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const a of anomalies) {
    sevMap[a.severity] = (sevMap[a.severity] ?? 0) + 1;
  }

  return {
    byType: Object.entries(typeMap).map(([type, { count, severity }]) => ({ type, count, severity })),
    bySeverity: Object.entries(sevMap).map(([severity, count]) => ({ severity, count })),
    total: anomalies.length,
  };
}

// ─── 4. Anomaly by District ───────────────────────────────────────────────────
export async function getAnomalyByDistrict() {
  const anomalies = await prisma.anomalyEvent.findMany({
    where: { entity_type: 'TRANSFER' },
    select: { entity_id: true, risk_score: true, severity: true },
  });

  // Fetch all linked transfers with their source district
  const transferIds = anomalies.map(a => a.entity_id);
  const transfers = await prisma.transfer.findMany({
    where: { id: { in: transferIds } },
    select: { id: true, source_facility: { select: { district: true } } },
  });

  const transferDistrictMap: Record<string, string> = {};
  for (const t of transfers) {
    transferDistrictMap[t.id] = t.source_facility.district;
  }

  const districtMap: Record<string, { count: number; totalRisk: number }> = {};
  for (const a of anomalies) {
    const district = transferDistrictMap[a.entity_id] ?? 'Unknown';
    if (!districtMap[district]) districtMap[district] = { count: 0, totalRisk: 0 };
    districtMap[district].count++;
    districtMap[district].totalRisk += a.risk_score;
  }

  return Object.entries(districtMap)
    .map(([district, { count, totalRisk }]) => ({
      district,
      count,
      avgRiskScore: Math.round(totalRisk / count),
    }))
    .sort((a, b) => b.count - a.count);
}

// ─── 5. District Summary ──────────────────────────────────────────────────────
export async function getDistrictSummary() {
  const [facilities, collections, transfers, anomalies] = await Promise.all([
    prisma.facility.findMany({ select: { district: true }, distinct: ['district'] }),
    prisma.milkCollection.findMany({
      include: { facility: { select: { district: true } } },
    }),
    prisma.transfer.findMany({
      include: { source_facility: { select: { district: true } } },
    }),
    prisma.anomalyEvent.findMany({ where: { entity_type: 'TRANSFER' }, select: { entity_id: true } }),
  ]);

  const anomalyTransferIds = new Set(anomalies.map(a => a.entity_id));

  const districts = facilities.map(f => f.district).filter(Boolean);

  const summaryMap: Record<string, { totalCollectedL: number; totalTransfers: number; discrepancies: number }> = {};
  for (const d of districts) {
    summaryMap[d] = { totalCollectedL: 0, totalTransfers: 0, discrepancies: 0 };
  }

  for (const c of collections) {
    const d = c.facility.district;
    if (summaryMap[d]) summaryMap[d].totalCollectedL += Number(c.quantity_liters);
  }

  for (const t of transfers) {
    const d = t.source_facility.district;
    if (summaryMap[d]) {
      summaryMap[d].totalTransfers++;
      if (t.status === 'DISCREPANCY') summaryMap[d].discrepancies++;
    }
  }

  return Object.entries(summaryMap)
    .map(([district, { totalCollectedL, totalTransfers, discrepancies }]) => ({
      district,
      totalCollectedL: Math.round(totalCollectedL),
      totalTransfers,
      discrepancies,
      discrepancyRate: totalTransfers > 0 ? Number(((discrepancies / totalTransfers) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.totalCollectedL - a.totalCollectedL);
}
