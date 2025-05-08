-- CreateTable
CREATE TABLE "PaymentRule" (
    "id" TEXT NOT NULL,
    "shiftTypeId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "paymentType" TEXT NOT NULL,
    "baseRate" DECIMAL(65,30) NOT NULL,
    "specialtyBonus" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "experienceMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentRule_shiftTypeId_roleId_effectiveDate_organizationId_key" ON "PaymentRule"("shiftTypeId", "roleId", "effectiveDate", "organizationId");

-- AddForeignKey
ALTER TABLE "PaymentRule" ADD CONSTRAINT "PaymentRule_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "ShiftType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRule" ADD CONSTRAINT "PaymentRule_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentRule" ADD CONSTRAINT "PaymentRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
