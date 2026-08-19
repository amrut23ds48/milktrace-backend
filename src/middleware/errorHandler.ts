import { Request, Response, NextFunction } from 'express';
import { AppError } from '../lib/errors';

// ─── Centralized Error Handler ────────────────────────────────────────────────
// This is the LAST middleware registered in app.ts (Express requires 4-arg signature).
// It catches all errors thrown by routes/services and returns a consistent JSON format:
//   { error: true, code: string, message: string }
//
// Rules (BACKEND_GUIDELINES.md §4):
//   - Never leak stack traces to the client in production
//   - Always use specific HTTP status codes
//   - AppError subclasses map to their own statusCode; unknown errors → 500

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: true,
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Unknown / unexpected error — log server-side, never expose internals
  // eslint-disable-next-line no-console
  console.error('[ErrorHandler] Unexpected error:', err);

  res.status(500).json({
    error: true,
    code: 'INTERNAL_SERVER_ERROR',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
  });
}
