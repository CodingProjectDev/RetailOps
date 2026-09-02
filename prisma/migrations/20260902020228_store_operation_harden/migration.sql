/*
  Warnings:

  - A unique constraint covering the columns `[store_id,product_id]` on the table `inventory` will be added. If there are existing duplicate values, this will fail.
  - Made the column `store_id` on table `inventory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `store_id` on table `inventory_movements` required. This step will fail if there are existing NULL values in that column.
  - Made the column `store_id` on table `purchase_orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `store_id` on table `refunds` required. This step will fail if there are existing NULL values in that column.
  - Made the column `store_id` on table `sales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `store_id` on table `shifts` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_store_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_store_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_store_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_store_id_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_store_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_store_id_fkey";

-- DropIndex
DROP INDEX "inventory_product_id_key";

-- AlterTable
ALTER TABLE "inventory" ALTER COLUMN "store_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "inventory_movements" ALTER COLUMN "store_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "purchase_orders" ALTER COLUMN "store_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "refunds" ALTER COLUMN "store_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "sales" ALTER COLUMN "store_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "shifts" ALTER COLUMN "store_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "inventory_product_id_idx" ON "inventory"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_store_id_product_id_key" ON "inventory"("store_id", "product_id");

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
