import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { router } from './routes';

// ─── Express Application ──────────────────────────────────────────────────────
// Separated from index.ts so Supertest integration tests can import `app`
// without binding to a port (which would prevent tests from running cleanly).

const app: Application = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://milktrace-frontend-one.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    // Allow any *.vercel.app preview deployment
    if (origin.endsWith('.vercel.app')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', router);

// ─── Centralized Error Handler ────────────────────────────────────────────────
// Must be registered LAST — Express identifies error handlers by their 4-arg signature.
app.use(errorHandler);

export default app;
