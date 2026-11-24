import { AppError } from '../utils/AppError.js';

const VALIDATED_KEYS = ['body', 'query', 'params'];

// Pemakaian: validate({ body: schema, query: schema, params: schema })
export const validate = (schemas) => (req, _res, next) => {
  for (const key of VALIDATED_KEYS) {
    const schema = schemas[key];

    if (!schema) continue;

    const result = schema.safeParse(req[key]);

    if (!result.success) {
      return next(
        new AppError(
          400,
          'VALIDATION_ERROR',
          'Data yang dikirim tidak valid',
          result.error.flatten().fieldErrors
        )
      );
    }

    // Express 5 membuat req.query dan req.params tidak dapat ditimpa.
    if (key === 'body') {
      req.body = result.data;
    } else {
      req.validated = {
        ...req.validated,
        [key]: result.data,
      };
    }
  }

  return next();
};
