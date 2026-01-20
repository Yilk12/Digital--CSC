-- CreateTable
CREATE TABLE "DriverDetaile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "empId" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "address" TEXT,
    "licenceNumber" TEXT NOT NULL,
    "licenceClass" TEXT NOT NULL,
    "licenceExpiredDate" TIMESTAMP(3) NOT NULL,
    "issuedBy" TEXT NOT NULL,
    "vehicleId" UUID,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "additionalInformation" TEXT,
    "licenceCertificate" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DriverDetaile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DriverDetaile_userId_idx" ON "DriverDetaile"("userId");

-- CreateIndex
CREATE INDEX "DriverDetaile_vehicleId_idx" ON "DriverDetaile"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "DriverDetaile_userId_empId_key" ON "DriverDetaile"("userId", "empId");

-- AddForeignKey
ALTER TABLE "DriverDetaile" ADD CONSTRAINT "DriverDetaile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverDetaile" ADD CONSTRAINT "DriverDetaile_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
