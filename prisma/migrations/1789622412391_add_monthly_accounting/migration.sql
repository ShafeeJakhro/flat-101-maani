-- AddedMonthlyAccounting
CREATE TABLE "Month" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Deposit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "monthId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(12, 2) NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Deposit_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month" ("id") ON DELETE CASCADE,
    CONSTRAINT "Deposit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id")
);

ALTER TABLE "Expense" ADD COLUMN "monthId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month" ("id") ON DELETE CASCADE;

ALTER TABLE "Settlement" ADD COLUMN "monthId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_monthId_fkey" FOREIGN KEY ("monthId") REFERENCES "Month" ("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX "Month_year_month_key" ON "Month"("year", "month");
CREATE INDEX "Month_status_idx" ON "Month"("status");
CREATE UNIQUE INDEX "Deposit_monthId_userId_key" ON "Deposit"("monthId", "userId");
CREATE INDEX "Deposit_monthId_idx" ON "Deposit"("monthId");
CREATE INDEX "Deposit_userId_idx" ON "Deposit"("userId");
CREATE INDEX "Expense_monthId_idx" ON "Expense"("monthId");
CREATE INDEX "Settlement_monthId_idx" ON "Settlement"("monthId");
