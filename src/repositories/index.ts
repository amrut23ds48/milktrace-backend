// repositories/index.ts
// ─── Data Access Layer ────────────────────────────────────────────────────────
// Repositories are the ONLY layer that interacts with the database (via Prisma/Drizzle).
// They expose simple CRUD/query functions; NO business logic lives here.
//
// Example usage:
//   export async function findUserById(id: string): Promise<User | null> { ... }
