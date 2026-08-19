// ─── Application Error Classes ───────────────────────────────────────────────
// All custom errors extend AppError so the centralized error handler can
// distinguish them from unexpected runtime errors and return the correct
// HTTP status + consistent JSON body: { error: true, code, message }

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    // Restore the prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 404 — Resource does not exist */
export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    const message = id
      ? `${resource} with id '${id}' was not found`
      : `${resource} was not found`;
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/** 400 — Request body or params are invalid */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/** 409 — Resource already exists (e.g. duplicate email) */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}
