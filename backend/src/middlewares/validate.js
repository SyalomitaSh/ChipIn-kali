import { AppError } from '../utils/AppError.js';

// Pemakaian: validate({ body: schema, query: schema, params: schema })
export const validate = (schemas) => (req, _res, next) => {
  for (const key of ['body', 'query', 'params']) {
    if (!schemas[key]) continue;
    const result = schemas[key].safeParse(req[key]);
    if (!result.success) {
      return next(
        new AppError(400, 'VALIDATION_ERROR', 'Data yang dikirim tidak valid', result.error.flatten().fieldErrors)
      );
    }
    // Express 5: req.query bersifat getter-only, jadi hanya body yang ditimpa
    if (key === 'body') req.body = result.data;
    else req.validated = { ...req.validated, [key]: result.data };
  }
  next();
};
