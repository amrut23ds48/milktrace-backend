import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL || '',
});
const prisma = new PrismaClient({ adapter });

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

async function main() {
  console.log('Seeding static permissions...');
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  
  await prisma.permission.createMany({
    data: permissions
  });
  
  console.log(`Inserted ${permissions.length} permissions!`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
