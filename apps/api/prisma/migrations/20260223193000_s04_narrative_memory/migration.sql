-- AlterTable
ALTER TABLE "Session"
ADD COLUMN "memoryJson" JSONB,
ADD COLUMN "runSummaryJson" JSONB,
ADD COLUMN "sceneSummaryJson" JSONB;
