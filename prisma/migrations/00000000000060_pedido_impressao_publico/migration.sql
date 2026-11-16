-- Pedido de impressão aberto a quem não tem conta: o autor passa a ser opcional e o pedido guarda
-- os dados de contato. Também guarda o número do ISBN informado.
ALTER TABLE "PedidoImpressao" ALTER COLUMN "authorId" DROP NOT NULL;
ALTER TABLE "PedidoImpressao" ADD COLUMN "isbn" TEXT;
ALTER TABLE "PedidoImpressao" ADD COLUMN "contatoNome" TEXT;
ALTER TABLE "PedidoImpressao" ADD COLUMN "contatoEmail" TEXT;
ALTER TABLE "PedidoImpressao" ADD COLUMN "contatoTelefone" TEXT;
