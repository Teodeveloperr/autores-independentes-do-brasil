-- Quem comprou o kit da Bienal já logado como autor fica registrado no pedido, para o painel
-- avisar que ainda há um kit para enviar o livro. Sem login na compra, o campo fica vazio.
ALTER TABLE "PedidoKit" ADD COLUMN "authorId" TEXT;

-- CreateIndex
CREATE INDEX "PedidoKit_authorId_idx" ON "PedidoKit"("authorId");

-- AddForeignKey
ALTER TABLE "PedidoKit" ADD CONSTRAINT "PedidoKit_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Author"("id") ON DELETE SET NULL ON UPDATE CASCADE;
