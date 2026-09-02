-- AlterTable
ALTER TABLE "sale_items" ADD COLUMN     "product_barcode" TEXT,
ADD COLUMN     "product_name" TEXT,
ADD COLUMN     "product_sku" TEXT;

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "cashier_name" TEXT;
