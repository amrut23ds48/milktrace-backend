import express, { Application } from 'express';

// ─── App Bootstrap ────────────────────────────────────────────────────────────
// Business logic will be added in subsequent phases.
// This file wires together middleware and routes only.

const app: Application = express();

app.use(express.json());

// TODO: Mount routes here in Phase 3
// e.g. app.use('/api/v1/users', userRoutes);

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] Running on http://localhost:${PORT}`);
});

export default app;
