-- AlterTable: troca Author.genero (texto único) por Author.generos (lista)
ALTER TABLE "Author" ADD COLUMN     "generos" TEXT[] NOT NULL DEFAULT ARRAY['Romance']::TEXT[];

-- Preserva o gênero já cadastrado de cada autor como o primeiro item da lista
UPDATE "Author" SET "generos" = ARRAY["genero"]::TEXT[] WHERE "genero" IS NOT NULL;

ALTER TABLE "Author" DROP COLUMN "genero";
