-- AlterTable
ALTER TABLE "inventory" ADD COLUMN     "store_id" TEXT;

-- AlterTable
ALTER TABLE "inventory_movements" ADD COLUMN     "store_id" TEXT;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "store_id" TEXT;

-- AlterTable
ALTER TABLE "refunds" ADD COLUMN     "store_id" TEXT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "store_id" TEXT;

-- AlterTable
ALTER TABLE "shifts" ADD COLUMN     "store_id" TEXT;

-- CreateIndex
CREATE INDEX "inventory_store_id_idx" ON "inventory"("store_id");

-- CreateIndex
CREATE INDEX "inventory_movements_store_id_idx" ON "inventory_movements"("store_id");

-- CreateIndex
CREATE INDEX "purchase_orders_store_id_idx" ON "purchase_orders"("store_id");

-- CreateIndex
CREATE INDEX "refunds_store_id_idx" ON "refunds"("store_id");

-- CreateIndex
CREATE INDEX "sales_store_id_idx" ON "sales"("store_id");

-- CreateIndex
CREATE INDEX "shifts_store_id_idx" ON "shifts"("store_id");

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE SET NULL ON UPDATE CASCADE;
