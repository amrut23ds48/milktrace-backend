import 'dotenv/config';
import app from './app';

// ─── Server Entry Point ───────────────────────────────────────────────────────
// This file only starts the HTTP server.
// All middleware, routes, and error handling are configured in app.ts.

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server] Running on http://localhost:${PORT}`);
});
