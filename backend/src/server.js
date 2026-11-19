import app from './app.js';
import { validateEnv } from './config/env.js';
import { connectRedis } from './config/redis.js';
import { orderService } from './services/orderService.js';

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

// Unpaid orders reserve stock. Release it if payment never arrives.
const pendingOrderTtlMinutes = Number(process.env.PENDING_ORDER_TTL_MINUTES) || 60;
const expiryTimer = process.env.NODE_ENV === 'test'
  ? null
  : setInterval(async () => {
      try {
        const cancelled = await orderService.cancelExpiredPendingOrders(pendingOrderTtlMinutes);
        if (cancelled > 0) {
          console.info(`[Orders] Cancelled ${cancelled} unpaid order(s) older than ${pendingOrderTtlMinutes} minutes and restocked items.`);
        }
      } catch (err) {
        console.error('[Orders] Unpaid order expiry failed:', err.message);
      }
    }, 5 * 60 * 1000);
expiryTimer?.unref();

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Closing HTTP server...');
  if (expiryTimer) clearInterval(expiryTimer);
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
