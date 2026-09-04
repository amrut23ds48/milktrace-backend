import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Fetching anomalous transfers...');
  const transfers = await prisma.transfer.findMany({
    where: { status: 'DISCREPANCY' },
    take: 50 // Limit to 50 anomalies
  });

  console.log(`Found ${transfers.length} anomalous transfers.`);
  let count = 0;
  for(const t of transfers) {
    await prisma.anomalyEvent.create({
      data: {
        anomaly_type: 'ROUTE_DEVIATION',
        severity: 'HIGH',
        risk_score: Math.floor(Math.random() * 20) + 80,
        entity_type: 'TRANSFER',
        entity_id: t.id,
        status: 'ACTIVE',
        created_at: t.dispatched_at
      }
    });
    count++;
  }
  console.log(`Created ${count} anomalies for transfers!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
