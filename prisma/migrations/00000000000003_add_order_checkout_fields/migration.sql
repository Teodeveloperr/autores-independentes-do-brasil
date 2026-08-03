-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "compradorEmail" TEXT,
ADD COLUMN     "compradorTelefone" TEXT,
ADD COLUMN     "quantidade" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'Aguardando pagamento';
