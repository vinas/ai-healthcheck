-- CreateTable
CREATE TABLE "Narrative" (
    "id" SERIAL NOT NULL,
    "clientKeyId" INTEGER NOT NULL,
    "executiveSummary" TEXT NOT NULL DEFAULT '',
    "stageInterpretations" JSONB NOT NULL,
    "roadmap" JSONB NOT NULL,
    "benchmarkContext" TEXT NOT NULL DEFAULT '',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Narrative_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Narrative_clientKeyId_key" ON "Narrative"("clientKeyId");

-- AddForeignKey
ALTER TABLE "Narrative" ADD CONSTRAINT "Narrative_clientKeyId_fkey" FOREIGN KEY ("clientKeyId") REFERENCES "ClientKey"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
