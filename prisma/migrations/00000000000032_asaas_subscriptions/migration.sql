-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "asaasSubscriptionId" TEXT,
ADD COLUMN     "asaasSubscriptionStatus" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Author_asaasSubscriptionId_key" ON "Author"("asaasSubscriptionId");

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "valorCentavos" INTEGER NOT NULL,
    "asaasPaymentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPayment_asaasPaymentId_key" ON "SubscriptionPayment"("asaasPaymentId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_authorId_idx" ON "SubscriptionPayment"("authorId");

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE CASCADE ON UPDATE CASCADE;
