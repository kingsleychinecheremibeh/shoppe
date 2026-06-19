-- DropIndex
DROP INDEX "CartItem_cartId_productId_key";

-- AlterTable
ALTER TABLE "CartItem" ADD COLUMN     "productImageId" TEXT,
ADD COLUMN     "selectedColor" TEXT;

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "productImageId" TEXT,
ADD COLUMN     "selectedColor" TEXT;
