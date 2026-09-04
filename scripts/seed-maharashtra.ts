import 'dotenv/config';
import { OrganizationType, FacilityType, CollectionSession, AnomalySeverity, FarmerRegistrationStatus, BatchStatus } from '../src/generated/prisma/client';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
});
const prisma = new PrismaClient({ adapter });
import { faker } from '@faker-js/faker';

const DISTRICTS = [
  'Ahmednagar', 'Akola', 'Amravati', 'Chhatrapati Sambhajinagar', 'Beed', 'Bhandara',
  'Buldhana', 'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli',
  'Jalgaon', 'Jalna', 'Kolhapur', 'Latur', 'Mumbai City', 'Mumbai Suburban',
  'Nagpur', 'Nanded', 'Nandurbar', 'Dharashiv', 'Palghar', 'Parbhani',
  'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara', 'Sindhudurg',
  'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal', 'Nashik'
];

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
          latitude: faker.location.latitude({ max: 22, min: 15 }),
          longitude: faker.location.longitude({ max: 80, min: 72 }),
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
          latitude: faker.location.latitude({ max: 22, min: 15 }),
          longitude: faker.location.longitude({ max: 80, min: 72 }),
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

    // Generate Batches
    let batchesData: any[] = [];
    for (let day = 0; day < 30; day++) {
      const date = new Date(now.getTime() - (day * 24 * 60 * 60 * 1000));
      date.setHours(12, 0, 0, 0); 
      
      for (let b = 0; b < 3; b++) {
        const source = faker.helpers.arrayElement(villageCenters);
        const dest = faker.helpers.arrayElement(chillingCenters);
        const status = day === 0 ? BatchStatus.IN_TRANSIT : BatchStatus.RECEIVED;
        
        batchesData.push({
          id: faker.string.uuid(),
          source_facility_id: source.id,
          destination_facility_id: dest.id,
          quantity_liters: faker.number.float({ min: 100, max: 1000, fractionDigits: 1 }),
          status,
          created_at: date,
          dispatched_at: date,
          received_at: day === 0 ? null : new Date(date.getTime() + 4 * 60 * 60 * 1000)
        });
      }
    }
    await prisma.batch.createMany({ data: batchesData });

    // Anomalies
    for(let i = 0; i < 5; i++) {
      await prisma.anomalyEvent.create({
        data: {
          anomaly_type: faker.helpers.arrayElement(['VOLUME_SPIKE', 'FAT_DROP', 'ROUTE_DEVIATION']),
          severity: faker.helpers.arrayElement([AnomalySeverity.LOW, AnomalySeverity.MEDIUM, AnomalySeverity.HIGH, AnomalySeverity.CRITICAL]),
          risk_score: faker.number.int({ min: 40, max: 99 }),
          entity_type: 'FACILITY',
          entity_id: faker.helpers.arrayElement(villageCenters).id,
          status: 'ACTIVE',
          created_at: faker.date.recent({ days: 30 })
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
