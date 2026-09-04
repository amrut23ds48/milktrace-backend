import { prisma } from '../lib/prisma';
import { TransferStatus } from '../generated/prisma/client';

export class MapService {
  async getFacilities() {
    const facilities = await prisma.facility.findMany({
      where: {
        status: 'ACTIVE',
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        milk_collections: {
          where: {
            // Rough approximation of "today" or recent
            collection_timestamp: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }
      }
    });

    return facilities.map(f => {
      // Aggregate volume for the day
      const dailyVolumeL = f.milk_collections.reduce((sum, c) => sum + Number(c.quantity_liters), 0);
      
      return {
        id: f.id,
        name: f.name,
        type: f.type,
        district: f.district,
        taluka: f.taluka,
        lat: Number(f.latitude),
        lng: Number(f.longitude),
        openAnomalies: 0, // Placeholder until Phase 8 (Anomalies) is fully built
        riskScore: Math.floor(Math.random() * 20), // Placeholder
        dailyVolumeL,
        status: f.status
      };
    });
  }

  async getRoutes() {
    // Treat active transfers as routes
    const transfers = await prisma.transfer.findMany({
      where: {
        status: {
          in: ['DISPATCHED', 'IN_TRANSIT', 'DISCREPANCY']
        }
      },
      include: {
        source_facility: true,
        destination_facility: true,
        batch: true
      }
    });

    const transferIds = transfers.map(t => t.id);
    const anomalies = await prisma.anomalyEvent.findMany({
      where: {
        entity_type: 'TRANSFER',
        entity_id: { in: transferIds },
        status: 'ACTIVE'
      }
    });

    const anomalyMap = new Map();
    anomalies.forEach(a => anomalyMap.set(a.entity_id, a));

    return transfers.map(t => {
      let status = 'NORMAL';
      if (t.status === 'IN_TRANSIT' || t.status === 'DISPATCHED') status = 'IN_TRANSIT';
      if (t.status === 'DISCREPANCY') status = 'ANOMALOUS';

      const anomaly = anomalyMap.get(t.id);
      
      const baseFat = 4.5 + Math.random() * 0.5; // ~4.5 - 5.0
      const baseSnf = 8.5 + Math.random() * 0.5; // ~8.5 - 9.0
      
      let receivedFat = baseFat;
      let receivedSnf = baseSnf;
      
      if (anomaly) {
        if (anomaly.anomaly_type === 'WATER_ADULTERATION' || anomaly.anomaly_type === 'VOLUME_SPIKE') {
          // Water added = Fat and SNF drop significantly
          receivedFat -= (0.5 + Math.random() * 0.8);
          receivedSnf -= (0.8 + Math.random() * 1.5);
        } else if (anomaly.anomaly_type === 'FAT_DROP' || anomaly.anomaly_type === 'THEFT_SUSPECTED') {
          // Cream skimming = Fat drops, SNF drops slightly
          receivedFat -= (0.4 + Math.random() * 1.0);
          receivedSnf -= Math.random() * 0.3;
        } else if (anomaly.anomaly_type === 'SNF_DROP') {
          receivedSnf -= (0.5 + Math.random() * 1.0);
        }
      }

      return {
        id: t.id,
        fromFacilityId: t.source_facility_id,
        toFacilityId: t.destination_facility_id,
        fromName: t.source_facility.name,
        toName: t.destination_facility.name,
        status,
        dispatchedL: Number(t.dispatched_quantity),
        receivedL: t.received_quantity ? Number(t.received_quantity) : 0,
        riskScore: t.status === 'DISCREPANCY' ? (anomaly ? anomaly.risk_score : 80) : 10,
        alerts: t.status === 'DISCREPANCY' 
          ? [anomaly ? `Alert: ${anomaly.anomaly_type.replace(/_/g, ' ')}` : 'Volume mismatch detected'] 
          : [],
        lastTransferAt: t.dispatched_at.toISOString(),
        batchId: t.batch_id,
        anomalyId: anomaly ? anomaly.id : undefined,
        dispatchedFat: Number(baseFat.toFixed(2)),
        receivedFat: t.received_quantity ? Number(receivedFat.toFixed(2)) : undefined,
        dispatchedSnf: Number(baseSnf.toFixed(2)),
        receivedSnf: t.received_quantity ? Number(receivedSnf.toFixed(2)) : undefined
      };
    });
  }

  async getDistrictStats() {
    // We aggregate volume per district
    // Since we don't have direct SQL group-by easily available for nested relations in Prisma without raw queries,
    // we'll fetch collections joined with facility and group in memory.
    // In production with large data, use prisma.$queryRaw.
    const facilities = await prisma.facility.findMany({
      where: { status: 'ACTIVE' },
      include: {
        milk_collections: true // For a real app, constrain by date
      }
    });

    const districtMap = new Map<string, { totalVolume: number, anomalies: number }>();

    facilities.forEach(f => {
      const volume = f.milk_collections.reduce((sum, c) => sum + Number(c.quantity_liters), 0);
      
      // Mock anomalies for now (random 0-5)
      const mockAnomalies = Math.floor(Math.random() * 3);

      if (!districtMap.has(f.district)) {
        districtMap.set(f.district, { totalVolume: 0, anomalies: 0 });
      }
      
      const stats = districtMap.get(f.district)!;
      stats.totalVolume += volume;
      stats.anomalies += mockAnomalies;
    });

    const results = [];
    for (const [district, stats] of districtMap.entries()) {
      let riskBand = 'LOW';
      if (stats.anomalies >= 7) riskBand = 'CRITICAL';
      else if (stats.anomalies >= 4) riskBand = 'HIGH';
      else if (stats.anomalies >= 2) riskBand = 'MEDIUM';

      results.push({
        district,
        totalAnomalies: stats.anomalies,
        riskBand,
        totalVolumeL: stats.totalVolume
      });
    }

    return results;
  }
}

export const mapService = new MapService();
