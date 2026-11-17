export class AppError extends Error {
  constructor(status, code, message, details = null) {
    super(message);

    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'AppError';

    Error.captureStackTrace?.(this, this.constructor);
  }
}