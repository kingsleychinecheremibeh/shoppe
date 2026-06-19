-- Scope idempotency keys to the user who created the order.
DROP INDEX IF EXISTS "Order_idempotencyKey_key";

CREATE UNIQUE INDEX "Order_userId_idempotencyKey_key" ON "Order"("userId", "idempotencyKey");
