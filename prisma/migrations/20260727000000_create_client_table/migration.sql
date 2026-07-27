-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "contactPersonName" VARCHAR(50),
    "contactPersonEmail" VARCHAR(100),
    "contactPersonPhone" VARCHAR(15),
    "uniqueKey" UUID NOT NULL DEFAULT gen_random_uuid(),
    "keyUsedAt" TIMESTAMP(3),

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_uniqueKey_key" ON "Client"("uniqueKey");
