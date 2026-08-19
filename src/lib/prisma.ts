import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// ─── Shared Prisma Client Singleton ──────────────────────────────────────────
// Prisma 7 requires a driver adapter for SQL connections.
// This singleton is imported by all repositories — never instantiate PrismaClient elsewhere.

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({ adapter });
