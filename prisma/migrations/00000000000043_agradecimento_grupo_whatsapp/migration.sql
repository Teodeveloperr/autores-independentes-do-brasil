-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "agradecimentoGrupoWhatsappVisto" BOOLEAN NOT NULL DEFAULT true;

-- Marca como "ainda não visto" só pra quem já era assinante Essencial/Premium neste
-- exato momento — autores que assinarem depois disso já nascem com o valor padrão
-- (true, não aparece) e não recebem esse convite retroativo.
UPDATE "Author" SET "agradecimentoGrupoWhatsappVisto" = false WHERE "plano" IN ('Autor Essencial', 'Autor Premium');
