-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "voided_by_id" TEXT;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_voided_by_id_fkey" FOREIGN KEY ("voided_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
