# MilkTrace — Backend

Express.js API server for the MilkTrace Maharashtra supply-chain traceability platform.

---

## Tech Stack

| Tool | Purpose |
|---|---|
| Node.js + Express.js | HTTP server |
| TypeScript (strict) | Language |
| Prisma 7 | ORM + migrations |
| PostgreSQL | Database (local Docker / Supabase in prod) |
| Jest + Supertest | Testing |
| ESLint + Prettier | Code quality |

---

## Prerequisites

- **Node.js** ≥ 18
- **Docker** (for local Postgres) — or a Supabase / PostgreSQL connection string
- **npm** ≥ 9

---

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
# Edit .env and fill in your DATABASE_URL, JWT_SECRET, etc.
```

### 3. Start local PostgreSQL (Docker)
```bash
docker run --name milktrace-db \
  -e POSTGRES_USER=milktrace \
  -e POSTGRES_PASSWORD=milktrace_dev \
  -e POSTGRES_DB=milktrace \
  -p 5432:5432 \
  -d postgres:16
```

Your `.env` `DATABASE_URL` should be:
```
DATABASE_URL="postgresql://milktrace:milktrace_dev@localhost:5432/milktrace"
```

### 4. Run database migrations
```bash
npm run db:migrate
```
This applies all migrations under `prisma/migrations/` to your local database.

### 5. Generate the Prisma client
```bash
npm run db:generate
```
> Run this whenever `prisma/schema.prisma` changes.

### 6. Start the dev server
```bash
npm run dev
```
Server starts on `http://localhost:3001` by default.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start dev server with `ts-node` |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` | Run compiled production build |
| `npm test` | Run Jest test suite |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix ESLint issues |
| `npm run format` | Format code with Prettier |
| `npm run db:migrate` | Create + apply a new migration (dev) |
| `npm run db:migrate:deploy` | Apply migrations (production/CI) |
| `npm run db:generate` | Re-generate Prisma client |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:reset` | Reset DB and re-apply all migrations |

---

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema (source of truth)
│   └── migrations/            # Versioned SQL migration files
├── src/
│   ├── index.ts               # App entry point
│   ├── routes/                # API Layer — HTTP handlers only, no business logic
│   ├── services/              # Business Logic Layer — core rules, calculations
│   ├── repositories/          # Data Access Layer — only layer that touches the DB
│   └── utils/                 # Pure helper functions
├── .env.example               # Template for required environment variables
├── prisma.config.ts           # Prisma 7 configuration
└── jest.config.js             # Jest configuration
```

### Layered Architecture (Strict Rule)

```
Request → Route Handler → Service → Repository → Database
```

- **Routes** extract HTTP params and delegate to a Service. No logic here.
- **Services** contain all business rules. They are HTTP-unaware.
- **Repositories** are the **only** layer that queries the database via Prisma.

See [`BACKEND_GUIDELINES.md`](../BACKEND_GUIDELINES.md) for full coding standards.

---

## Database

The schema currently includes the foundational entities:

- `organizations` — top-level operational entities
- `roles` + `permissions` + `role_permissions` — RBAC system
- `facilities` — physical locations with a self-referential parent hierarchy
- `users` — system users scoped to an org, role, and optional facility

Future phases will add: `farmers`, `animals`, `milk_collections`, `batches`, `transfers`, `anomalies`, and more.

### Connecting to Supabase (Production)

1. Create a project on [supabase.com](https://supabase.com)
2. Copy the connection URI from **Settings → Database → URI**
3. Set it as `DATABASE_URL` in your production environment
4. Run `npm run db:migrate:deploy` to apply all migrations

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Secret for signing JWTs | `change_me_in_production` |
| `JWT_EXPIRES_IN` | JWT expiry duration | `7d` |

> ⚠️ Never commit `.env` — it is in `.gitignore`.

---

## Testing

```bash
npm test                # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

Tests are co-located in `src/` as `*.test.ts` files. The stack uses **Jest** for unit tests and **Supertest** for API integration tests.

---

*This file will be updated as the project evolves through subsequent development phases.*
