-- Staff alert for payments that were taken but could not be applied to an order.
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'REFUND_REQUIRED';
