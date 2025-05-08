-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('HOURLY', 'WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "StaffCompensationRate" ADD COLUMN     "paymentType" "PaymentType" NOT NULL DEFAULT 'HOURLY';

-- CreateTable
CREATE TABLE "ShiftTypePremium" (
    "id" TEXT NOT NULL,
    "shiftTypeId" TEXT NOT NULL,
    "compensationRateId" TEXT NOT NULL,
    "isPremiumPercentage" BOOLEAN NOT NULL DEFAULT true,
    "premiumValue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftTypePremium_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShiftTypePremium_shiftTypeId_compensationRateId_effectiveDa_key" ON "ShiftTypePremium"("shiftTypeId", "compensationRateId", "effectiveDate");

-- AddForeignKey
ALTER TABLE "ShiftTypePremium" ADD CONSTRAINT "ShiftTypePremium_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "ShiftType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftTypePremium" ADD CONSTRAINT "ShiftTypePremium_compensationRateId_fkey" FOREIGN KEY ("compensationRateId") REFERENCES "StaffCompensationRate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
