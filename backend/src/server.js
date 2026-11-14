import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`ChipIn API berjalan di http://localhost:${env.PORT}/api (${env.NODE_ENV})`);
});

const shutdown = (signal) => {
  console.log(`${signal} diterima, menutup server...`);
  server.close(() => process.exit(0));
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
