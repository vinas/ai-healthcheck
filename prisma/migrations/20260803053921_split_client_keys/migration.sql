-- CreateTable
CREATE TABLE "ClientKey" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "uniqueKey" UUID NOT NULL,
    "keyUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientKey_pkey" PRIMARY KEY ("id")
);

-- Carry over every existing Client's uniqueKey/keyUsedAt before the columns disappear
INSERT INTO "ClientKey" ("clientId", "uniqueKey", "keyUsedAt", "createdAt")
SELECT "id", "uniqueKey", "keyUsedAt", CURRENT_TIMESTAMP FROM "Client";

-- DropIndex
DROP INDEX "Client_uniqueKey_key";

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "keyUsedAt",
DROP COLUMN "uniqueKey";

-- CreateIndex
CREATE UNIQUE INDEX "ClientKey_uniqueKey_key" ON "ClientKey"("uniqueKey");

-- AddForeignKey
ALTER TABLE "ClientKey" ADD CONSTRAINT "ClientKey_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
