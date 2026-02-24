-- CreateTable
CREATE TABLE "Profile" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profile_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Session" ADD COLUMN "profileId" TEXT;

-- AlterTable
ALTER TABLE "TelemetryEvent" ADD COLUMN "profileId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Profile_deviceId_key" ON "Profile"("deviceId");

-- CreateIndex
CREATE INDEX "Profile_updatedAt_idx" ON "Profile"("updatedAt");

-- CreateIndex
CREATE INDEX "Session_profileId_idx" ON "Session"("profileId");

-- CreateIndex
CREATE INDEX "TelemetryEvent_profileId_idx" ON "TelemetryEvent"("profileId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
