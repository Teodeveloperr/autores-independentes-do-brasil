-- AlterTable
ALTER TABLE "Author" ADD COLUMN     "fraseApresentacao" TEXT,
ADD COLUMN     "profissoes" TEXT,
ADD COLUMN     "visualizacoes" INTEGER NOT NULL DEFAULT 0;
