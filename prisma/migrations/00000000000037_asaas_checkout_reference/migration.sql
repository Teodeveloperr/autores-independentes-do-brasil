-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "asaasCheckoutReference" TEXT;
ALTER TABLE "PendingSignup" ADD COLUMN     "asaasCheckoutReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Author_asaasCheckoutReference_key" ON "Author"("asaasCheckoutReference");
CREATE UNIQUE INDEX "PendingSignup_asaasCheckoutReference_key" ON "PendingSignup"("asaasCheckoutReference");
