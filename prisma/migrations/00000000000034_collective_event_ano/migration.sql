-- AlterTable
ALTER TABLE "CollectiveEvent" ADD COLUMN     "ano" INTEGER;

-- Backfill: usa o ano de criação do evento pra quem já existia antes desse campo.
UPDATE "CollectiveEvent" SET "ano" = EXTRACT(YEAR FROM "createdAt")::int WHERE "ano" IS NULL;

-- AlterTable
ALTER TABLE "CollectiveEvent" ALTER COLUMN "ano" SET NOT NULL;
