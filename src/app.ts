import express, { Application } from 'express';
import { errorHandler } from './middleware/errorHandler';
import { router } from './routes';

// ─── Express Application ──────────────────────────────────────────────────────
// Separated from index.ts so Supertest integration tests can import `app`
// without binding to a port (which would prevent tests from running cleanly).

const app: Application = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', router);

// ─── Centralized Error Handler ────────────────────────────────────────────────
// Must be registered LAST — Express identifies error handlers by their 4-arg signature.
app.use(errorHandler);

export default app;
