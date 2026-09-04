import 'dotenv/config';
import { PrismaClient } from './src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function checkUser() {
  const users = await prisma.user.findMany({
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true }
          }
        }
      }
    }
  });

  for (const u of users) {
    console.log(`User: ${u.name} | Role: ${u.role?.name}`);
    console.log(`Perms: ${u.role?.permissions.map(rp => rp.permission?.code).join(', ')}`);
    console.log('---');
  }
}

checkUser().then(() => prisma.$disconnect());
