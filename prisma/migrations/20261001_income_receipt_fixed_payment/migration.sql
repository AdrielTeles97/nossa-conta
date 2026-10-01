-- Recebimento de receita por competência (YYYY-MM). Recorrente começa desmarcado todo mês.
CREATE TABLE IF NOT EXISTS "income_receipt" (
    "id" TEXT NOT NULL,
    "incomeId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "income_receipt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "income_receipt_incomeId_competence_key" ON "income_receipt"("incomeId", "competence");
CREATE INDEX IF NOT EXISTS "income_receipt_incomeId_idx" ON "income_receipt"("incomeId");
CREATE INDEX IF NOT EXISTS "income_receipt_householdId_idx" ON "income_receipt"("householdId");
CREATE INDEX IF NOT EXISTS "income_receipt_competence_idx" ON "income_receipt"("competence");

-- Pagamento de despesa fixa por competência (YYYY-MM). Cada mês começa desmarcado.
CREATE TABLE IF NOT EXISTS "fixed_expense_payment" (
    "id" TEXT NOT NULL,
    "fixedExpenseId" TEXT NOT NULL,
    "householdId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competence" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "fixed_expense_payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "fixed_expense_payment_fixedExpenseId_competence_key" ON "fixed_expense_payment"("fixedExpenseId", "competence");
CREATE INDEX IF NOT EXISTS "fixed_expense_payment_fixedExpenseId_idx" ON "fixed_expense_payment"("fixedExpenseId");
CREATE INDEX IF NOT EXISTS "fixed_expense_payment_householdId_idx" ON "fixed_expense_payment"("householdId");
CREATE INDEX IF NOT EXISTS "fixed_expense_payment_competence_idx" ON "fixed_expense_payment"("competence");

-- FKs
DO $$ BEGIN
  ALTER TABLE "income_receipt" ADD CONSTRAINT "income_receipt_incomeId_fkey" FOREIGN KEY ("incomeId") REFERENCES "Income"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "income_receipt" ADD CONSTRAINT "income_receipt_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "income_receipt" ADD CONSTRAINT "income_receipt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "fixed_expense_payment" ADD CONSTRAINT "fixed_expense_payment_fixedExpenseId_fkey" FOREIGN KEY ("fixedExpenseId") REFERENCES "FixedExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "fixed_expense_payment" ADD CONSTRAINT "fixed_expense_payment_householdId_fkey" FOREIGN KEY ("householdId") REFERENCES "household"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "fixed_expense_payment" ADD CONSTRAINT "fixed_expense_payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null;
END $$;
