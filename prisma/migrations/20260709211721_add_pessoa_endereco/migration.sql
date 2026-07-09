/*
  Warnings:

  - You are about to drop the `animais` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `fazendas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lotes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `racas` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PessoaTipo" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "EstadoCivil" AS ENUM ('SOLTEIRO', 'CASADO', 'UNIAO_ESTAVEL', 'DIVORCIADO', 'VIUVO');

-- DropForeignKey
ALTER TABLE "animais" DROP CONSTRAINT "animais_fazenda_origem_id_fkey";

-- DropForeignKey
ALTER TABLE "animais" DROP CONSTRAINT "animais_lote_id_fkey";

-- DropForeignKey
ALTER TABLE "animais" DROP CONSTRAINT "animais_mae_id_fkey";

-- DropForeignKey
ALTER TABLE "animais" DROP CONSTRAINT "animais_pai_id_fkey";

-- DropForeignKey
ALTER TABLE "animais" DROP CONSTRAINT "animais_raca_id_fkey";

-- DropTable
DROP TABLE "animais";

-- DropTable
DROP TABLE "fazendas";

-- DropTable
DROP TABLE "lotes";

-- DropTable
DROP TABLE "racas";

-- CreateTable
CREATE TABLE "endereco" (
    "id" SERIAL NOT NULL,
    "cep" TEXT NOT NULL,
    "logradouro" TEXT NOT NULL,
    "numero" TEXT,
    "complemento" TEXT,
    "bairro" TEXT,
    "municipio" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "pais" TEXT NOT NULL,

    CONSTRAINT "endereco_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pessoa" (
    "id" TEXT NOT NULL,
    "tipo" "PessoaTipo" NOT NULL,
    "documento" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "inscricao_estadual" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "deleted_at" TIMESTAMP(3),
    "endereco_id" INTEGER,
    "nome_fantasia" TEXT,
    "rg" TEXT,
    "data_nascimento" DATE,
    "estado_civil" "EstadoCivil",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "raca" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "raca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lote" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fazenda" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "fazenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal" (
    "id" TEXT NOT NULL,
    "brinco" TEXT NOT NULL,
    "rfid" TEXT,
    "nome" TEXT,
    "data_nascimento" DATE,
    "peso_nascimento_kg" DOUBLE PRECISION,
    "sexo" "Sexo" NOT NULL DEFAULT 'MACHO',
    "origem" "AnimalOrigem" NOT NULL DEFAULT 'NASCIMENTO',
    "status" "AnimalStatus" NOT NULL DEFAULT 'ATIVO',
    "raca_id" INTEGER,
    "lote_id" INTEGER,
    "mae_id" TEXT,
    "pai_id" TEXT,
    "fazenda_origem_id" INTEGER,
    "fazenda_origem_nome" TEXT,
    "data_aquisicao" DATE,
    "valor_compra" DECIMAL(10,2),
    "idade_entrada_meses" INTEGER,
    "peso_atual_kg" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_documento_key" ON "pessoa"("documento");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_inscricao_estadual_key" ON "pessoa"("inscricao_estadual");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_email_key" ON "pessoa"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_endereco_id_key" ON "pessoa"("endereco_id");

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_rg_key" ON "pessoa"("rg");

-- CreateIndex
CREATE INDEX "pessoa_tipo_idx" ON "pessoa"("tipo");

-- CreateIndex
CREATE INDEX "pessoa_nome_idx" ON "pessoa"("nome");

-- CreateIndex
CREATE INDEX "pessoa_deleted_at_idx" ON "pessoa"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "raca_nome_key" ON "raca"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "lote_nome_key" ON "lote"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "fazenda_nome_key" ON "fazenda"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "animal_brinco_key" ON "animal"("brinco");

-- CreateIndex
CREATE UNIQUE INDEX "animal_rfid_key" ON "animal"("rfid");

-- CreateIndex
CREATE INDEX "animal_lote_id_idx" ON "animal"("lote_id");

-- CreateIndex
CREATE INDEX "animal_raca_id_idx" ON "animal"("raca_id");

-- CreateIndex
CREATE INDEX "animal_status_idx" ON "animal"("status");

-- AddForeignKey
ALTER TABLE "pessoa" ADD CONSTRAINT "pessoa_endereco_id_fkey" FOREIGN KEY ("endereco_id") REFERENCES "endereco"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_raca_id_fkey" FOREIGN KEY ("raca_id") REFERENCES "raca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_mae_id_fkey" FOREIGN KEY ("mae_id") REFERENCES "animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_fazenda_origem_id_fkey" FOREIGN KEY ("fazenda_origem_id") REFERENCES "fazenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
