-- CreateTable
CREATE TABLE "WomenadnSocilaInclusion" (
    "id" UUID NOT NULL,
    "typeOfMisconduct" TEXT NOT NULL,
    "dateTime" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "detailDescriptionOfIncident" TEXT,
    "reportedBefore" BOOLEAN NOT NULL,
    "medicalHelpNeeded" BOOLEAN NOT NULL,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WomenadnSocilaInclusion_pkey" PRIMARY KEY ("id")
);
