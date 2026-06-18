CREATE TYPE "DrawStatus" AS ENUM ('confirmed');

CREATE TABLE "Player" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "deviceId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DrawResult" (
  "id" TEXT NOT NULL,
  "playerId" TEXT NOT NULL,
  "prizeCode" TEXT NOT NULL,
  "prizeLabel" TEXT NOT NULL,
  "status" "DrawStatus" NOT NULL DEFAULT 'confirmed',
  "idempotencyKey" TEXT NOT NULL,
  "resetVersion" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DrawResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PrizeInventory" (
  "id" TEXT NOT NULL,
  "prizeCode" TEXT NOT NULL,
  "prizeLabel" TEXT NOT NULL,
  "totalQty" INTEGER NOT NULL,
  "remainingQty" INTEGER NOT NULL,
  "activeFlag" BOOLEAN NOT NULL DEFAULT true,
  "resetVersion" INTEGER NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PrizeInventory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ResetEvent" (
  "id" TEXT NOT NULL,
  "exportFileName" TEXT NOT NULL,
  "exportedAt" TIMESTAMP(3) NOT NULL,
  "performedBy" TEXT NOT NULL,
  "previousVersion" INTEGER NOT NULL,
  "nextVersion" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ResetEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminUser" (
  "id" TEXT NOT NULL,
  "username" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AppState" (
  "id" TEXT NOT NULL DEFAULT 'app',
  "resetVersion" INTEGER NOT NULL DEFAULT 1,
  "campaignStatus" TEXT NOT NULL DEFAULT 'active',
  "currentCampaignName" TEXT NOT NULL DEFAULT 'Workshop Bình Gốm Thanh Hà',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Player_studentId_key" ON "Player"("studentId");
CREATE UNIQUE INDEX "Player_phone_key" ON "Player"("phone");
CREATE UNIQUE INDEX "Player_deviceId_key" ON "Player"("deviceId");
CREATE UNIQUE INDEX "DrawResult_playerId_resetVersion_key" ON "DrawResult"("playerId", "resetVersion");
CREATE UNIQUE INDEX "DrawResult_idempotencyKey_resetVersion_key" ON "DrawResult"("idempotencyKey", "resetVersion");
CREATE INDEX "DrawResult_prizeCode_resetVersion_idx" ON "DrawResult"("prizeCode", "resetVersion");
CREATE UNIQUE INDEX "PrizeInventory_prizeCode_resetVersion_key" ON "PrizeInventory"("prizeCode", "resetVersion");
CREATE UNIQUE INDEX "AdminUser_username_key" ON "AdminUser"("username");

ALTER TABLE "DrawResult"
  ADD CONSTRAINT "DrawResult_playerId_fkey"
  FOREIGN KEY ("playerId") REFERENCES "Player"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
