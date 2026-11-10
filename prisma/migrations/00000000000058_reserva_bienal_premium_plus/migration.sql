-- CreateTable
CREATE TABLE "ReservaBienalPremiumPlus" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "dia" DATE NOT NULL,
    "horaInicio" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReservaBienalPremiumPlus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReservaBienalPremiumPlus_authorId_key" ON "ReservaBienalPremiumPlus"("authorId");

-- CreateIndex
CREATE INDEX "ReservaBienalPremiumPlus_dia_horaInicio_idx" ON "ReservaBienalPremiumPlus"("dia", "horaInicio");

-- AddForeignKey
ALTER TABLE "ReservaBienalPremiumPlus" ADD CONSTRAINT "ReservaBienalPremiumPlus_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
