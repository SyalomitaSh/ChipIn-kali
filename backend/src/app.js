import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import routes from './routes/index.js';
import {
  notFound,
  errorHandler,
} from './middlewares/errorHandler.js';

const app = express();

const allowedOrigins =
  env.CORS_ORIGIN === '*'
    ? '*'
    : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

app.use(helmet());
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.get('/', (_req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Welcome to ChipIn API!',
    data: {
      name: 'ChipIn Backend',
      version: '1.0.0',
      status: 'Running',
      documentation: '/api/docs',
    },
  });
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
