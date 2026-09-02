-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "business_id" TEXT;

-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "business_id" TEXT;

-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN     "business_id" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "business_id" TEXT;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "business_id" TEXT;

-- AlterTable
ALTER TABLE "refunds" ADD COLUMN     "business_id" TEXT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "business_id" TEXT;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "business_id" TEXT;

-- AlterTable
ALTER TABLE "suppliers" ADD COLUMN     "business_id" TEXT;

-- CreateIndex
CREATE INDEX "categories_business_id_idx" ON "categories"("business_id");

-- CreateIndex
CREATE INDEX "inventory_business_id_idx" ON "inventory"("business_id");

-- CreateIndex
CREATE INDEX "inventory_movements_business_id_idx" ON "inventory_movements"("business_id");

-- CreateIndex
CREATE INDEX "products_business_id_idx" ON "products"("business_id");

-- CreateIndex
CREATE INDEX "purchase_orders_business_id_idx" ON "purchase_orders"("business_id");

-- CreateIndex
CREATE INDEX "refunds_business_id_idx" ON "refunds"("business_id");

-- CreateIndex
CREATE INDEX "sales_business_id_idx" ON "sales"("business_id");

-- CreateIndex
CREATE INDEX "shifts_business_id_idx" ON "shifts"("business_id");

-- CreateIndex
CREATE INDEX "suppliers_business_id_idx" ON "suppliers"("business_id");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE SET NULL ON UPDATE CASCADE;
