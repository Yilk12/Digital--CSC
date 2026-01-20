-- CreateTable
CREATE TABLE "ThirdPartySexualAssault" (
    "id" UUID NOT NULL,
    "misconductId" UUID NOT NULL,
    "typeOfMisconduct" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "descriptionOfWhatWasObserved" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThirdPartySexualAssault_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ThirdPartySexualAssault_misconductId_idx" ON "ThirdPartySexualAssault"("misconductId");

-- AddForeignKey
ALTER TABLE "ThirdPartySexualAssault" ADD CONSTRAINT "ThirdPartySexualAssault_misconductId_fkey" FOREIGN KEY ("misconductId") REFERENCES "WomenadnSocilaInclusion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
