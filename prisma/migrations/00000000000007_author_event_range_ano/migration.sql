-- AlterTable: renomeia "dia" para "diaInicio", adiciona "diaFim" (intervalo de datas) e "ano"
ALTER TABLE "AuthorEvent" RENAME COLUMN "dia" TO "diaInicio";
ALTER TABLE "AuthorEvent" ADD COLUMN     "diaFim" INTEGER;
ALTER TABLE "AuthorEvent" ADD COLUMN     "ano" INTEGER NOT NULL DEFAULT 2026;
ALTER TABLE "AuthorEvent" ALTER COLUMN "ano" DROP DEFAULT;
