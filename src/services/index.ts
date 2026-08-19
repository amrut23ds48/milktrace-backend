// services/index.ts
// ─── Business Logic Layer ─────────────────────────────────────────────────────
// Service functions contain ALL core business logic (e.g., Mass-Balance calculations,
// Anomaly Engine rules, Authorization checks).
// This layer must be completely unaware of HTTP (no req/res objects here).
// Services call Repositories for data access.
//
// Example usage:
//   export async function createUser(data: CreateUserDto): Promise<User> { ... }
