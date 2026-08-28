-- CreateTable
CREATE TABLE "household" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "household_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "household_inviteCode_key" ON "household"("inviteCode");

-- AlterTable account (idToken/issuer added for better-auth 1.7+)
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "idToken" TEXT;
ALTER TABLE "account" ADD COLUMN IF NOT EXISTS "issuer" TEXT;

-- AlterTable user
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "householdId" TEXT;

-- AlterTable Income
ALTER TABLE "Income" ADD COLUMN IF NOT EXISTS "householdId" TEXT;
CREATE INDEX IF NOT EXISTS "Income_householdId_idx" ON "Income"("householdId");

-- AlterTable VariableExpense
ALTER TABLE "VariableExpense" ADD COLUMN IF NOT EXISTS "householdId" TEXT;
CREATE INDEX IF NOT EXISTS "VariableExpense_householdId_idx" ON "VariableExpense"("householdId");

-- AlterTable Investment
ALTER TABLE "Investment" ADD COLUMN IF NOT EXISTS "householdId" TEXT;
CREATE INDEX IF NOT EXISTS "Investment_householdId_idx" ON "Investment"("householdId");

-- AlterTable Asset
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "householdId" TEXT;
CREATE INDEX IF NOT EXISTS "Asset_householdId_idx" ON "Asset"("householdId");

-- AlterTable Debt
ALTER TABLE "Debt" ADD COLUMN IF NOT EXISTS "householdId" TEXT;
CREATE INDEX IF NOT EXISTS "Debt_householdId_idx" ON "Debt"("householdId");

-- AlterTable FixedExpense
ALTER TABLE "FixedExpense" ADD COLUMN IF NOT EXISTS "householdId" TEXT;
CREATE INDEX IF NOT EXISTS "FixedExpense_householdId_idx" ON "FixedExpense"("householdId");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "user" ADD CONSTRAINT "user_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Income" ADD CONSTRAINT "Income_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "VariableExpense" ADD CONSTRAINT "VariableExpense_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Investment" ADD CONSTRAINT "Investment_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Asset" ADD CONSTRAINT "Asset_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "Debt" ADD CONSTRAINT "Debt_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
