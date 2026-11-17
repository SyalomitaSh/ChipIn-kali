import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

export const notFound = (req, _res, next) =>
  next(new AppError(404, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} tidak ditemukan`));

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    err = new AppError(400, 'INVALID_JSON', 'Body request bukan JSON yang valid');
  }

  const status = err.status || 500;
  const isKnown = err instanceof AppError;

  if (!isKnown) console.error(err);

  res.status(status).json({
    success: false,
    error: {
      code: isKnown ? err.code : 'INTERNAL_ERROR',
      message: isKnown ? err.message : 'Terjadi kesalahan pada server',
      ...(err.details && { details: err.details }),
      ...(env.NODE_ENV === 'development' && !isKnown && { debug: err.message }),
    },
  });
};
