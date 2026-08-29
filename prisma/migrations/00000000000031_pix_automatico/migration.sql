-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "cpf" TEXT,
ADD COLUMN     "asaasPixCustomerId" TEXT,
ADD COLUMN     "asaasPixAutoAuthorizationId" TEXT,
ADD COLUMN     "asaasPixAutoStatus" TEXT,
ADD COLUMN     "planoPendente" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Author_asaasPixAutoAuthorizationId_key" ON "Author"("asaasPixAutoAuthorizationId");
