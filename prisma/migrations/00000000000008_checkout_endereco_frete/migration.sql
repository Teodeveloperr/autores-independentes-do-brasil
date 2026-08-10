-- AlterTable: endereço de origem do autor (necessário para cotação de frete)
ALTER TABLE "Author" ADD COLUMN     "enderecoCep" TEXT,
ADD COLUMN     "enderecoRua" TEXT,
ADD COLUMN     "enderecoNumero" TEXT,
ADD COLUMN     "enderecoComplemento" TEXT,
ADD COLUMN     "enderecoBairro" TEXT,
ADD COLUMN     "enderecoCidade" TEXT,
ADD COLUMN     "enderecoUf" TEXT;

-- AlterTable: dimensões físicas do livro (necessário para cotação de frete)
ALTER TABLE "Book" ADD COLUMN     "pesoGramas" INTEGER,
ADD COLUMN     "alturaCm" INTEGER,
ADD COLUMN     "larguraCm" INTEGER,
ADD COLUMN     "comprimentoCm" INTEGER;

-- AlterTable: endereço de entrega do comprador + agrupamento de pedidos da mesma compra
ALTER TABLE "Order" ADD COLUMN     "compradorCep" TEXT,
ADD COLUMN     "compradorRua" TEXT,
ADD COLUMN     "compradorNumero" TEXT,
ADD COLUMN     "compradorComplemento" TEXT,
ADD COLUMN     "compradorBairro" TEXT,
ADD COLUMN     "compradorCidade" TEXT,
ADD COLUMN     "compradorUf" TEXT,
ADD COLUMN     "grupoPedidoId" TEXT;

-- CreateIndex
CREATE INDEX "Order_grupoPedidoId_idx" ON "Order"("grupoPedidoId");
