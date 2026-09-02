/*
  Warnings:

  - A unique constraint covering the columns `[business_id,name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[business_id,barcode]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[business_id,sku]` on the table `products` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[business_id,po_number]` on the table `purchase_orders` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[business_id,refund_number]` on the table `refunds` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[business_id,receipt_number]` on the table `sales` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[business_id,shift_number]` on the table `shifts` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[business_id,name]` on the table `suppliers` will be added. If there are existing duplicate values, this will fail.
  - Made the column `business_id` on table `categories` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_id` on table `inventory` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_id` on table `inventory_movements` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_id` on table `products` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_id` on table `purchase_orders` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_id` on table `refunds` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_id` on table `sales` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_id` on table `shifts` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_id` on table `suppliers` required. This step will fail if there are existing NULL values in that column.
  - Made the column `business_id` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_business_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory" DROP CONSTRAINT "inventory_business_id_fkey";

-- DropForeignKey
ALTER TABLE "inventory_movements" DROP CONSTRAINT "inventory_movements_business_id_fkey";

-- DropForeignKey
ALTER TABLE "products" DROP CONSTRAINT "products_business_id_fkey";

-- DropForeignKey
ALTER TABLE "purchase_orders" DROP CONSTRAINT "purchase_orders_business_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_business_id_fkey";

-- DropForeignKey
ALTER TABLE "sales" DROP CONSTRAINT "sales_business_id_fkey";

-- DropForeignKey
ALTER TABLE "shifts" DROP CONSTRAINT "shifts_business_id_fkey";

-- DropForeignKey
ALTER TABLE "suppliers" DROP CONSTRAINT "suppliers_business_id_fkey";

-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_business_id_fkey";

-- DropIndex
DROP INDEX "categories_name_key";

-- DropIndex
DROP INDEX "products_barcode_key";

-- DropIndex
DROP INDEX "products_sku_key";

-- DropIndex
DROP INDEX "purchase_orders_po_number_key";

-- DropIndex
DROP INDEX "refunds_refund_number_key";

-- DropIndex
DROP INDEX "sales_receipt_number_key";

-- DropIndex
DROP INDEX "shifts_shift_number_key";

-- DropIndex
DROP INDEX "suppliers_name_key";

-- AlterTable
ALTER TABLE "categories" ALTER COLUMN "business_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "inventory" ALTER COLUMN "business_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "inventory_movements" ALTER COLUMN "business_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "business_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "purchase_orders" ALTER COLUMN "business_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "refunds" ALTER COLUMN "business_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "sales" ALTER COLUMN "business_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "shifts" ALTER COLUMN "business_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "suppliers" ALTER COLUMN "business_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "business_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categories_business_id_name_key" ON "categories"("business_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "products_business_id_barcode_key" ON "products"("business_id", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "products_business_id_sku_key" ON "products"("business_id", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_orders_business_id_po_number_key" ON "purchase_orders"("business_id", "po_number");

-- CreateIndex
CREATE UNIQUE INDEX "refunds_business_id_refund_number_key" ON "refunds"("business_id", "refund_number");

-- CreateIndex
CREATE UNIQUE INDEX "sales_business_id_receipt_number_key" ON "sales"("business_id", "receipt_number");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_business_id_shift_number_key" ON "shifts"("business_id", "shift_number");

-- CreateIndex
CREATE UNIQUE INDEX "suppliers_business_id_name_key" ON "suppliers"("business_id", "name");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
