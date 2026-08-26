-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "prazoFinal" TIMESTAMP(3) NOT NULL,
    "estado" TEXT NOT NULL,
    "valor" TEXT,
    "link" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);
