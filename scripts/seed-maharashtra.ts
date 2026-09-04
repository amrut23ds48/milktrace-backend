import 'dotenv/config';
import {
  OrganizationType,
  FacilityType,
  CollectionSession,
  AnomalySeverity,
  FarmerRegistrationStatus,
  BatchStatus,
  TransferStatus
} from '../src/generated/prisma/client';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
});
const prisma = new PrismaClient({ adapter });
import { faker } from '@faker-js/faker';

const DISTRICT_COORDS: Record<string, { lat: number, lng: number }> = {
  'Ahmednagar': { lat: 19.0948, lng: 74.7480 },
  'Akola': { lat: 20.7059, lng: 77.0082 },
  'Amravati': { lat: 20.9320, lng: 77.7523 },
  'Chhatrapati Sambhajinagar': { lat: 19.8762, lng: 75.3433 },
  'Beed': { lat: 18.9891, lng: 75.7601 },
  'Bhandara': { lat: 21.1777, lng: 79.6582 },
  'Buldhana': { lat: 20.5312, lng: 76.1834 },
  'Chandrapur': { lat: 19.9615, lng: 79.2961 },
  'Dhule': { lat: 20.9042, lng: 74.7749 },
  'Gadchiroli': { lat: 20.1849, lng: 79.9948 },
  'Gondia': { lat: 21.4624, lng: 80.1982 },
  'Hingoli': { lat: 19.7161, lng: 77.1472 },
  'Jalgaon': { lat: 21.0077, lng: 75.5626 },
  'Jalna': { lat: 19.8347, lng: 75.8816 },
  'Kolhapur': { lat: 16.7050, lng: 74.2433 },
  'Latur': { lat: 18.4088, lng: 76.5604 },
  'Mumbai City': { lat: 18.9750, lng: 72.8258 },
  'Mumbai Suburban': { lat: 19.0838, lng: 72.8809 },
  'Nagpur': { lat: 21.1458, lng: 79.0882 },
  'Nanded': { lat: 19.1383, lng: 77.3210 },
  'Nandurbar': { lat: 21.3735, lng: 74.2483 },
  'Dharashiv': { lat: 18.1856, lng: 76.0419 },
  'Palghar': { lat: 19.6967, lng: 72.7699 },
  'Parbhani': { lat: 19.2699, lng: 76.7748 },
  'Pune': { lat: 18.5204, lng: 73.8567 },
  'Raigad': { lat: 18.5158, lng: 72.9288 },
  'Ratnagiri': { lat: 16.9902, lng: 73.3120 },
  'Sangli': { lat: 16.8524, lng: 74.5815 },
  'Satara': { lat: 17.6805, lng: 74.0183 },
  'Sindhudurg': { lat: 16.1627, lng: 73.6983 },
  'Solapur': { lat: 17.6599, lng: 75.9064 },
  'Thane': { lat: 19.2183, lng: 72.9781 },
  'Wardha': { lat: 20.7453, lng: 78.6022 },
  'Washim': { lat: 20.1065, lng: 77.1279 },
  'Yavatmal': { lat: 20.3888, lng: 78.1204 },
  'Nashik': { lat: 19.9975, lng: 73.7898 },
};

const DISTRICTS = Object.keys(DISTRICT_COORDS);

async function main() {
  console.log('Starting massive data seed for Maharashtra...');
  
  // ⚠️  This script wipes and re-seeds the database.
  // To seed Supabase, pass --force flag: ts-node scripts/seed-maharashtra.ts --force
  const isForced = process.argv.includes('--force');
  if (!isForced && process.env.DATABASE_URL?.includes('supabase')) {
    console.error('🚨  Supabase DB detected. Pass --force to seed it:');
    console.error('    npm run seed:mock -- --force');
    process.exit(1);
  }

  console.log('Cleaning existing data (Cascading Deletes)...');
  await prisma.auditLog.deleteMany();
  await prisma.investigation.deleteMany();
  await prisma.anomalyEvent.deleteMany();
  await prisma.transfer.deleteMany();
  await prisma.batchItem.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.qualityMeasurement.deleteMany();
  await prisma.milkCollection.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.businessVerification.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();
  await prisma.facility.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.organization.deleteMany();

  console.log('Creating Organization...');
  const org = await prisma.organization.create({
    data: { name: 'MahaMilk Federation', type: OrganizationType.COOPERATIVE, registration_number: 'MAHA-12345' }
  });

  console.log('Creating Permissions...');
  const permissions = [
    { code: "system.view", name: "View System", category: "SYSTEM", description: "View system configurations" },
    { code: "user.create", name: "Create User", category: "USER", description: "Create new users" },
    { code: "user.view", name: "View Users", category: "USER", description: "View users" },
    { code: "user.update", name: "Update User", category: "USER", description: "Update users" },
    { code: "user.delete", name: "Delete User", category: "USER", description: "Delete users" },
    { code: "role.create", name: "Create Role", category: "ROLE", description: "Create roles" },
    { code: "role.view", name: "View Roles", category: "ROLE", description: "View roles" },
    { code: "role.update", name: "Update Role", category: "ROLE", description: "Update roles" },
    { code: "role.delete", name: "Delete Role", category: "ROLE", description: "Delete roles" },
    { code: "facility.create", name: "Create Facility", category: "FACILITY", description: "Create facilities" },
    { code: "facility.view", name: "View Facilities", category: "FACILITY", description: "View facilities" },
    { code: "facility.update", name: "Update Facility", category: "FACILITY", description: "Update facilities" },
    { code: "facility.delete", name: "Delete Facility", category: "FACILITY", description: "Delete facilities" },
    { code: "collection.create", name: "Create Collection", category: "COLLECTION", description: "Create milk collections" },
    { code: "collection.view", name: "View Collections", category: "COLLECTION", description: "View collections" },
    { code: "batch.create", name: "Create Batch", category: "BATCH", description: "Create batches" },
    { code: "batch.view", name: "View Batches", category: "BATCH", description: "View batches" },
    { code: "batch.dispatch", name: "Dispatch Batch", category: "BATCH", description: "Dispatch batches" },
    { code: "farmer.create", name: "Create Farmer", category: "FARMER", description: "Create farmers" },
    { code: "farmer.view", name: "View Farmers", category: "FARMER", description: "View farmers" }
  ];
  await prisma.permission.createMany({ data: permissions });

  console.log('Creating Roles...');
  const saRole = await prisma.role.create({ data: { name: 'Super Admin', organization_id: org.id } });
  const vcRole = await prisma.role.create({ data: { name: 'Village Admin', organization_id: org.id } });
  const ccRole = await prisma.role.create({ data: { name: 'Chilling Admin', organization_id: org.id } });

  const superAdminId = process.env.SUPER_ADMIN_UUID;
  if (!superAdminId) {
    console.warn("⚠️ No SUPER_ADMIN_UUID provided in .env! Skipping Super Admin creation.");
  } else {
    console.log(`Creating Super Admin profile for Auth UUID: ${superAdminId}...`);
    const superAdminPasswordHash = await bcrypt.hash('admin1234', 10);
    await prisma.user.create({
      data: {
        id: superAdminId,
        organization_id: org.id,
        role_id: saRole.id,
        name: 'Super Admin',
        email: 'admin@milktrace.local',
        password_hash: superAdminPasswordHash,
      }
    });
    console.log('✅ Super Admin created — email: admin@milktrace.local | password: admin1234');
  }

  // Create a dedicated Village Admin test user with login credentials
  const villageTestPasswordHash = await bcrypt.hash('village1234', 10);
  const villageTestUser = await prisma.user.create({
    data: {
      organization_id: org.id,
      role_id: vcRole.id,
      name: 'Test Village Admin',
      email: 'village@milktrace.local',
      password_hash: villageTestPasswordHash,
    }
  });
  console.log('✅ Village Admin created — email: village@milktrace.local | password: village1234');

  const BATCH_SIZE = 5000;
  
  for (const district of DISTRICTS) {
    console.log(`Processing District: ${district} ...`);
    
    // Facilities
    const villageCenters = [];
    for (let i=0; i<5; i++) {
      villageCenters.push(await prisma.facility.create({
        data: {
          name: `${district} Village Center ${i+1}`,
          type: FacilityType.VILLAGE_COLLECTION_CENTER,
          district,
          organization_id: org.id,
          latitude: faker.location.latitude({ max: DISTRICT_COORDS[district].lat + 0.3, min: DISTRICT_COORDS[district].lat - 0.3 }),
          longitude: faker.location.longitude({ max: DISTRICT_COORDS[district].lng + 0.3, min: DISTRICT_COORDS[district].lng - 0.3 }),
        }
      }));
    }

    const chillingCenters = [];
    for (let i=0; i<3; i++) {
      chillingCenters.push(await prisma.facility.create({
        data: {
          name: `${district} Chilling Center ${i+1}`,
          type: FacilityType.CHILLING_CENTER,
          district,
          organization_id: org.id,
          latitude: faker.location.latitude({ max: DISTRICT_COORDS[district].lat + 0.3, min: DISTRICT_COORDS[district].lat - 0.3 }),
          longitude: faker.location.longitude({ max: DISTRICT_COORDS[district].lng + 0.3, min: DISTRICT_COORDS[district].lng - 0.3 }),
        }
      }));
    }

    // Dummy Operators
    const vcOperator = await prisma.user.create({
      data: {
        organization_id: org.id,
        role_id: vcRole.id,
        name: `VC Operator ${district}`,
        facility_id: villageCenters[0]!.id
      }
    });

    const ccOperator = await prisma.user.create({
      data: {
        organization_id: org.id,
        role_id: ccRole.id,
        name: `CC Operator ${district}`,
        facility_id: chillingCenters[0]!.id
      }
    });

    // 50 Farmers per district
    const farmersData = [];
    for (let i=0; i<50; i++) {
      const vc = faker.helpers.arrayElement(villageCenters);
      farmersData.push({
        id: faker.string.uuid(),
        farmer_code: `F-${district.substring(0,3).toUpperCase()}-${faker.string.alphanumeric(6).toUpperCase()}`,
        name: faker.person.fullName(),
        phone: faker.phone.number({ style: 'national' }),
        village: faker.location.city(),
        district,
        registration_status: FarmerRegistrationStatus.APPROVED,
        collection_center_id: vc.id,
        created_at: faker.date.past({ years: 1 })
      });
    }
    await prisma.farmer.createMany({ data: farmersData });

    // 1-4 Animals per Farmer
    const animalsData = [];
    for (const farmer of farmersData) {
      const numAnimals = faker.number.int({ min: 1, max: 4 });
      for (let j = 0; j < numAnimals; j++) {
        animalsData.push({
          id: faker.string.uuid(),
          farmer_id: farmer.id,
          species: faker.helpers.arrayElement(['COW', 'BUFFALO']),
          breed: faker.helpers.arrayElement(['HF', 'Gir', 'Murrah', 'Jersey']),
          identifier: `TAG-${faker.string.alphanumeric(6).toUpperCase()}`,
          sex: 'FEMALE',
          approximate_age: faker.number.int({ min: 2, max: 8 }),
          expected_daily_yield: faker.number.float({ min: 8, max: 20, fractionDigits: 1 }),
          expected_fat: faker.number.float({ min: 3, max: 7, fractionDigits: 1 }),
          expected_snf: faker.number.float({ min: 7.5, max: 9.5, fractionDigits: 1 }),
          created_at: farmer.created_at
        });
      }
    }
    await prisma.animal.createMany({ data: animalsData });

    // 30 Days of Milk Collections
    let collectionsData: any[] = [];
    const now = new Date();
    
    for (let day = 0; day < 30; day++) {
      const date = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
      date.setHours(8, 0, 0, 0); 
      
      for (const f of farmersData) {
        if (Math.random() > 0.95) continue; // 5% chance of missing a day
        
        collectionsData.push({
          id: faker.string.uuid(),
          collection_code: `C-${faker.string.alphanumeric(8).toUpperCase()}`,
          farmer_id: f.id,
          facility_id: f.collection_center_id,
          operator_id: vcOperator.id,
          session: CollectionSession.MORNING,
          quantity_liters: faker.number.float({ min: 5, max: 25, fractionDigits: 1 }),
          collection_timestamp: date,
          created_at: date
        });
        
        if (collectionsData.length >= BATCH_SIZE) {
          await prisma.milkCollection.createMany({ data: collectionsData });
          collectionsData = [];
        }
      }
    }
    if (collectionsData.length > 0) {
      await prisma.milkCollection.createMany({ data: collectionsData });
    }

    // Generate Batches and Transfers
    let batchesData: any[] = [];
    let transfersData: any[] = [];
    
    // Create some District Facilities and Businesses first to connect them
    const districtFacilities = [];
    for (let i=0; i<2; i++) {
      districtFacilities.push(await prisma.facility.create({
        data: {
          name: `${district} District Plant ${i+1}`,
          type: FacilityType.DISTRICT_FACILITY,
          district,
          organization_id: org.id,
          latitude: faker.location.latitude({ max: DISTRICT_COORDS[district].lat + 0.3, min: DISTRICT_COORDS[district].lat - 0.3 }),
          longitude: faker.location.longitude({ max: DISTRICT_COORDS[district].lng + 0.3, min: DISTRICT_COORDS[district].lng - 0.3 }),
        }
      }));
    }
    const businesses = [];
    for (let i=0; i<2; i++) {
      businesses.push(await prisma.facility.create({
        data: {
          name: `${district} Business Corp ${i+1}`,
          type: FacilityType.BUSINESS_RECEIVING_FACILITY,
          district,
          organization_id: org.id,
          latitude: faker.location.latitude({ max: DISTRICT_COORDS[district].lat + 0.3, min: DISTRICT_COORDS[district].lat - 0.3 }),
          longitude: faker.location.longitude({ max: DISTRICT_COORDS[district].lng + 0.3, min: DISTRICT_COORDS[district].lng - 0.3 }),
        }
      }));
    }

    for (let day = 0; day < 30; day++) {
      const date = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
      date.setHours(12, 0, 0, 0); 
      
      for (let b = 0; b < 5; b++) {
        // Mix of Village -> Chilling, Chilling -> District, District -> Business
        const routeType = faker.helpers.arrayElement(['VC_CC', 'CC_DF', 'DF_BIZ']);
        let source, dest;
        if (routeType === 'VC_CC') {
          source = faker.helpers.arrayElement(villageCenters);
          dest = faker.helpers.arrayElement(chillingCenters);
        } else if (routeType === 'CC_DF') {
          source = faker.helpers.arrayElement(chillingCenters);
          dest = faker.helpers.arrayElement(districtFacilities);
        } else {
          source = faker.helpers.arrayElement(districtFacilities);
          dest = faker.helpers.arrayElement(businesses);
        }

        const batchStatus = day === 0 ? BatchStatus.IN_TRANSIT : BatchStatus.RECEIVED;
        const transferStatus = day === 0 ? TransferStatus.IN_TRANSIT : TransferStatus.RECEIVED;
        
        const batchId = faker.string.uuid();
        const dispatchedQty = faker.number.float({ min: 100, max: 1000, fractionDigits: 1 });
        
        batchesData.push({
          id: batchId,
          source_facility_id: source.id,
          destination_facility_id: dest.id,
          quantity_liters: dispatchedQty,
          status: batchStatus,
          created_at: date,
          dispatched_at: date,
          received_at: day === 0 ? null : new Date(date.getTime() + 4 * 60 * 60 * 1000)
        });

        // Some discrepancy logic for anomalous routes
        let receivedQty = day === 0 ? null : dispatchedQty;
        let finalTransferStatus: TransferStatus = transferStatus;
        if (day !== 0 && Math.random() > 0.8) { // 20% anomalous
           receivedQty = dispatchedQty * 0.8; // 20% loss
           finalTransferStatus = TransferStatus.DISCREPANCY;
        }

        transfersData.push({
          id: faker.string.uuid(),
          batch_id: batchId,
          source_facility_id: source.id,
          destination_facility_id: dest.id,
          dispatched_quantity: dispatchedQty,
          received_quantity: receivedQty,
          status: finalTransferStatus,
          dispatched_at: date,
          received_at: day === 0 ? null : new Date(date.getTime() + 4 * 60 * 60 * 1000)
        });
      }
    }
    await prisma.batch.createMany({ data: batchesData });
    await prisma.transfer.createMany({ data: transfersData });

    // Anomalies for Facilities
    for(let i = 0; i < 5; i++) {
      await prisma.anomalyEvent.create({
        data: {
          anomaly_type: faker.helpers.arrayElement(['VOLUME_SPIKE', 'FAT_DROP']),
          severity: faker.helpers.arrayElement([AnomalySeverity.LOW, AnomalySeverity.MEDIUM, AnomalySeverity.HIGH, AnomalySeverity.CRITICAL]),
          risk_score: faker.number.int({ min: 40, max: 99 }),
          entity_type: 'FACILITY',
          entity_id: faker.helpers.arrayElement(villageCenters).id,
          status: 'ACTIVE',
          created_at: faker.date.recent({ days: 30 })
        }
      });
    }

    // Anomalies for Transfers
    const anomalousTransfers = transfersData.filter(t => t.status === TransferStatus.DISCREPANCY);
    for(const t of anomalousTransfers.slice(0, 5)) {
      await prisma.anomalyEvent.create({
        data: {
          anomaly_type: 'ROUTE_DEVIATION',
          severity: faker.helpers.arrayElement([AnomalySeverity.HIGH, AnomalySeverity.CRITICAL]),
          risk_score: faker.number.int({ min: 70, max: 99 }),
          entity_type: 'TRANSFER',
          entity_id: t.id,
          status: 'ACTIVE',
          created_at: t.dispatched_at
        }
      });
    }
  }

  console.log('Seed completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
