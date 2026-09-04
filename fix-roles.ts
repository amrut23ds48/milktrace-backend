import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function fixRoles() {
  try {
    const missingPerms = [
      { code: 'farmer.update', name: 'Update Farmer', category: 'FARMER', description: 'Update farmers' },
      { code: 'farmer.delete', name: 'Delete Farmer', category: 'FARMER', description: 'Delete farmers' },
      { code: 'collection.update', name: 'Update Collection', category: 'COLLECTION', description: 'Update collections' },
      { code: 'batch.update', name: 'Update Batch', category: 'BATCH', description: 'Update batches' },
    ];
    for (const p of missingPerms) {
      await prisma.permission.upsert({
        where: { code: p.code },
        update: {},
        create: p,
      });
    }

    const roles = await prisma.role.findMany();
    const permissions = await prisma.permission.findMany();
    
    for (const role of roles) {
      console.log(`Processing Role: ${role.name}`);
      let assignedPerms = [];
      
      if (role.name === 'Super Admin') {
        // Give all permissions
        assignedPerms = permissions;
      } else if (role.name === 'Village Admin') {
        assignedPerms = permissions.filter(p => [
          'collection.view', 'collection.create', 'collection.update',
          'farmer.view', 'farmer.create', 'farmer.update',
          'facility.view',
          'batch.view', 'batch.create', 'transfer.create'
        ].includes(p.code));
      } else if (role.name === 'Chilling Admin') {
        assignedPerms = permissions.filter(p => [
          'batch.view', 'batch.create', 'batch.dispatch', 'transfer.create',
          'facility.view'
        ].includes(p.code));
      }
      
      // Clear existing RolePermissions for this role
      await prisma.rolePermission.deleteMany({ where: { role_id: role.id } });
      
      // Create new RolePermissions
      for (const p of assignedPerms) {
        await prisma.rolePermission.create({
          data: {
            role_id: role.id,
            permission_id: p.id
          }
        });
      }
      console.log(`✅ Assigned ${assignedPerms.length} permissions to ${role.name}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

fixRoles();
