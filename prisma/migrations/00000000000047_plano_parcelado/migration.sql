-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "asaasParceladoInstallmentId" TEXT,
ADD COLUMN     "planoParceladoAte" TIMESTAMP(3),
ADD COLUMN     "planoParceladoLembreteEnviadoEm" TIMESTAMP(3);

ALTER TABLE "PendingSignup" ADD COLUMN     "asaasParceladoInstallmentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Author_asaasParceladoInstallmentId_key" ON "Author"("asaasParceladoInstallmentId");
CREATE UNIQUE INDEX "PendingSignup_asaasParceladoInstallmentId_key" ON "PendingSignup"("asaasParceladoInstallmentId");
