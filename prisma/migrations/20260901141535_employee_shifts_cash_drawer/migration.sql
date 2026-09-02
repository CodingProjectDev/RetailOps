-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'CLOSED', 'FORCE_CLOSED');

-- AlterTable
ALTER TABLE "sales" ADD COLUMN     "shift_id" TEXT;

-- CreateTable
CREATE TABLE "shifts" (
    "id" TEXT NOT NULL,
    "shift_number" TEXT NOT NULL,
    "cashier_id" TEXT NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "opening_cash" DECIMAL(10,2) NOT NULL,
    "expected_cash" DECIMAL(10,2),
    "closing_cash" DECIMAL(10,2),
    "cash_difference" DECIMAL(10,2),
    "notes" TEXT,
    "force_close_reason" TEXT,
    "force_closed_by_id" TEXT,
    "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMP(3),

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shifts_shift_number_key" ON "shifts"("shift_number");

-- CreateIndex
CREATE INDEX "shifts_cashier_id_status_idx" ON "shifts"("cashier_id", "status");

-- CreateIndex
CREATE INDEX "shifts_opened_at_idx" ON "shifts"("opened_at");

-- CreateIndex
CREATE INDEX "sales_shift_id_idx" ON "sales"("shift_id");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_cashier_id_fkey" FOREIGN KEY ("cashier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_force_closed_by_id_fkey" FOREIGN KEY ("force_closed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
