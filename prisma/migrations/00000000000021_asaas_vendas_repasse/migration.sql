-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "pixKey" TEXT,
ADD COLUMN     "pixKeyType" TEXT;

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "compradorCpf" TEXT,
ADD COLUMN     "asaasCustomerId" TEXT,
ADD COLUMN     "asaasPaymentId" TEXT,
ADD COLUMN     "repasseStatus" TEXT NOT NULL DEFAULT 'pendente',
ADD COLUMN     "repasseAsaasTransferId" TEXT,
ADD COLUMN     "repasseErro" TEXT;
