-- AlterTable
ALTER TABLE "PendingSignup" ALTER COLUMN "asaasPixCustomerId" DROP NOT NULL;
ALTER TABLE "PendingSignup" ALTER COLUMN "asaasPixAutoAuthorizationId" DROP NOT NULL;
ALTER TABLE "PendingSignup" ADD COLUMN     "asaasCustomerId" TEXT;
ALTER TABLE "PendingSignup" ADD COLUMN     "asaasSubscriptionId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "PendingSignup_asaasSubscriptionId_key" ON "PendingSignup"("asaasSubscriptionId");
