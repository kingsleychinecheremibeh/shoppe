import app from './app.js';
import { validateEnv } from './config/env.js';
import { connectRedis } from './config/redis.js';

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception] Shutting down...', err.name, err.message, err.stack);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  validateEnv();
  await connectRedis();
}

export const server = process.env.NODE_ENV === 'test'
  ? null
  : app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Closing HTTP server...');
  server?.close(() => {
    console.log('HTTP server closed.');
  });
});

process.on('unhandledRejection', (err) => {
  console.error('[Unhandled Rejection] Shutting down...', err.name, err.message);
  if (process.env.NODE_ENV === 'test') return;
  server?.close(() => {
    process.exit(1);
  });
});

export { app };
export default app;
