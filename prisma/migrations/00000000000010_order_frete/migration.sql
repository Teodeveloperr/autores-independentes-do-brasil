-- AlterTable: valor do frete calculado e nome do serviço/transportadora usado
ALTER TABLE "Order" ADD COLUMN     "freteCentavos" INTEGER,
ADD COLUMN     "freteServico" TEXT;
