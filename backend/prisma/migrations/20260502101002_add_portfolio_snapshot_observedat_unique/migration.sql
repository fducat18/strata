/*
  Warnings:

  - A unique constraint covering the columns `[observed_at]` on the table `portfolio_snapshots` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "portfolio_snapshots_observed_at_key" ON "portfolio_snapshots"("observed_at");
