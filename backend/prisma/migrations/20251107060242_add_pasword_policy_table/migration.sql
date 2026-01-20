-- CreateTable
CREATE TABLE "PasswordPolicy" (
    "id" SERIAL NOT NULL,
    "minLength" INTEGER NOT NULL DEFAULT 12,
    "requireUppercase" BOOLEAN NOT NULL DEFAULT true,
    "requireLowercase" BOOLEAN NOT NULL DEFAULT true,
    "requireDigit" BOOLEAN NOT NULL DEFAULT true,
    "requireAtSymbol" BOOLEAN NOT NULL DEFAULT true,
    "expirationDays" INTEGER NOT NULL DEFAULT 90,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordPolicy_pkey" PRIMARY KEY ("id")
);
