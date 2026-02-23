-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'ENDED');

-- CreateEnum
CREATE TYPE "TelemetrySource" AS ENUM ('server', 'client');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "capsuleId" TEXT NOT NULL,
    "presetId" TEXT,
    "seed" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "rev" INTEGER NOT NULL DEFAULT 0,
    "lastTurnSeq" INTEGER NOT NULL DEFAULT 0,
    "currentStateJson" JSONB NOT NULL,
    "lastPacketJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turn" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "turnId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "requestJson" JSONB NOT NULL,
    "outcomeJson" JSONB NOT NULL,
    "deltasJson" JSONB,
    "packetJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Turn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Snapshot" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "stateJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Snapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TelemetryEvent" (
    "id" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "source" "TelemetrySource" NOT NULL,
    "deviceId" TEXT,
    "sessionId" TEXT,
    "turnId" TEXT,
    "eventName" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_capsuleId_idx" ON "Session"("capsuleId");

-- CreateIndex
CREATE INDEX "Session_updatedAt_idx" ON "Session"("updatedAt");

-- CreateIndex
CREATE INDEX "Turn_sessionId_idx" ON "Turn"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Turn_sessionId_turnId_key" ON "Turn"("sessionId", "turnId");

-- CreateIndex
CREATE UNIQUE INDEX "Turn_sessionId_seq_key" ON "Turn"("sessionId", "seq");

-- CreateIndex
CREATE INDEX "Snapshot_sessionId_idx" ON "Snapshot"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Snapshot_sessionId_seq_key" ON "Snapshot"("sessionId", "seq");

-- CreateIndex
CREATE INDEX "TelemetryEvent_source_idx" ON "TelemetryEvent"("source");

-- CreateIndex
CREATE INDEX "TelemetryEvent_sessionId_idx" ON "TelemetryEvent"("sessionId");

-- CreateIndex
CREATE INDEX "TelemetryEvent_turnId_idx" ON "TelemetryEvent"("turnId");

-- CreateIndex
CREATE INDEX "TelemetryEvent_eventName_idx" ON "TelemetryEvent"("eventName");

-- CreateIndex
CREATE INDEX "TelemetryEvent_ts_idx" ON "TelemetryEvent"("ts");

-- AddForeignKey
ALTER TABLE "Turn" ADD CONSTRAINT "Turn_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Snapshot" ADD CONSTRAINT "Snapshot_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
