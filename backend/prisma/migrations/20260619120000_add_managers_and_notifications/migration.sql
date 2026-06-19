ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'MANAGER';

CREATE TYPE "ManagerPermission" AS ENUM (
  'ORDER_MANAGEMENT',
  'PRODUCT_MANAGEMENT',
  'SHIPPING_MANAGEMENT',
  'ANALYTICS'
);

CREATE TYPE "NotificationAudience" AS ENUM (
  'CUSTOMER',
  'STAFF'
);

CREATE TYPE "NotificationType" AS ENUM (
  'PAYMENT_RECEIVED',
  'ORDER_SHIPPED',
  'ORDER_DELIVERED',
  'NEW_PRODUCT'
);

ALTER TABLE "User" ADD COLUMN "managerPermissions" "ManagerPermission"[] DEFAULT ARRAY[]::"ManagerPermission"[];

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "audience" "NotificationAudience" NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "metadata" JSONB,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Notification_audience_createdAt_idx" ON "Notification"("audience", "createdAt");
CREATE INDEX "Notification_type_createdAt_idx" ON "Notification"("type", "createdAt");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
