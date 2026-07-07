-- Drop unused legacy tables (confirmed empty: 0 rows each, no longer in schema.prisma)
DROP TABLE IF EXISTS "Post";
DROP TABLE IF EXISTS "User";
DROP TABLE IF EXISTS "PerformanceTest";

-- Rename tables to match @@map (preserves data, rows, and FK constraints)
ALTER TABLE "Raca" RENAME TO "racas";
ALTER TABLE "Lote" RENAME TO "lotes";
ALTER TABLE "Fazenda" RENAME TO "fazendas";
ALTER TABLE "Animal" RENAME TO "animais";

-- Rename column to match the new Prisma field name (no @map kept for this one)
ALTER TABLE "animais" RENAME COLUMN "nome_apelido" TO "nome";

-- Align createdAt/updatedAt with their new @map("created_at"/"updated_at")
ALTER TABLE "animais" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "animais" RENAME COLUMN "updatedAt" TO "updated_at";

-- Rename enum values in place, preserving existing rows that reference them
ALTER TYPE "Sexo" RENAME VALUE 'M' TO 'MACHO';
ALTER TYPE "Sexo" RENAME VALUE 'F' TO 'FEMEA';

-- Add the DB-level default matching schema.prisma's @default(MACHO)
ALTER TABLE "animais" ALTER COLUMN "sexo" SET DEFAULT 'MACHO';

-- Calendar-only fields: drop the time-of-day/timezone component (matches @db.Date)
ALTER TABLE "animais" ALTER COLUMN "data_nascimento" TYPE DATE USING "data_nascimento"::date;
ALTER TABLE "animais" ALTER COLUMN "data_aquisicao" TYPE DATE USING "data_aquisicao"::date;

-- valor_compra: Float -> Decimal(10,2), matches schema.prisma's @db.Decimal(10, 2)
ALTER TABLE "animais" ALTER COLUMN "valor_compra" TYPE DECIMAL(10,2) USING "valor_compra"::numeric(10,2);

-- New indexes declared in schema.prisma
CREATE INDEX "animais_lote_id_idx" ON "animais"("lote_id");
CREATE INDEX "animais_raca_id_idx" ON "animais"("raca_id");
CREATE INDEX "animais_status_idx" ON "animais"("status");

-- Rename constraints/indexes so future `prisma migrate diff` shows no drift
ALTER TABLE "racas" RENAME CONSTRAINT "Raca_pkey" TO "racas_pkey";
ALTER TABLE "lotes" RENAME CONSTRAINT "Lote_pkey" TO "lotes_pkey";
ALTER TABLE "fazendas" RENAME CONSTRAINT "Fazenda_pkey" TO "fazendas_pkey";
ALTER TABLE "animais" RENAME CONSTRAINT "Animal_pkey" TO "animais_pkey";

ALTER INDEX "Raca_nome_key" RENAME TO "racas_nome_key";
ALTER INDEX "Lote_nome_key" RENAME TO "lotes_nome_key";
ALTER INDEX "Fazenda_nome_key" RENAME TO "fazendas_nome_key";
ALTER INDEX "Animal_brinco_key" RENAME TO "animais_brinco_key";
ALTER INDEX "Animal_rfid_key" RENAME TO "animais_rfid_key";

ALTER TABLE "animais" RENAME CONSTRAINT "Animal_raca_id_fkey" TO "animais_raca_id_fkey";
ALTER TABLE "animais" RENAME CONSTRAINT "Animal_lote_id_fkey" TO "animais_lote_id_fkey";
ALTER TABLE "animais" RENAME CONSTRAINT "Animal_mae_id_fkey" TO "animais_mae_id_fkey";
ALTER TABLE "animais" RENAME CONSTRAINT "Animal_pai_id_fkey" TO "animais_pai_id_fkey";
ALTER TABLE "animais" RENAME CONSTRAINT "Animal_fazenda_origem_id_fkey" TO "animais_fazenda_origem_id_fkey";
