-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('M', 'F');

-- CreateEnum
CREATE TYPE "AnimalOrigem" AS ENUM ('NASCIMENTO', 'COMPRA', 'TRANSFERENCIA');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('ATIVO', 'VENDIDO', 'MORTO', 'TRANSFERIDO', 'DESCARTE', 'ABATE');

-- CreateTable
CREATE TABLE "Raca" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Raca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lote" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Lote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fazenda" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Fazenda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "rfid" TEXT,
    "brinco" TEXT,
    "nome_apelido" TEXT,
    "sexo" "Sexo" NOT NULL,
    "data_nascimento" TIMESTAMP(3),
    "peso_nascimento_kg" DOUBLE PRECISION,
    "origem" "AnimalOrigem" NOT NULL DEFAULT 'NASCIMENTO',
    "status" "AnimalStatus" NOT NULL DEFAULT 'ATIVO',
    "raca_id" INTEGER,
    "lote_id" INTEGER,
    "mae_id" TEXT,
    "pai_id" TEXT,
    "fazenda_origem_id" INTEGER,
    "fazenda_origem_nome" TEXT,
    "data_aquisicao" TIMESTAMP(3),
    "valor_compra" DOUBLE PRECISION,
    "idade_entrada_meses" INTEGER,
    "peso_atual_kg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Raca_nome_key" ON "Raca"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Lote_nome_key" ON "Lote"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Fazenda_nome_key" ON "Fazenda"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Animal_rfid_key" ON "Animal"("rfid");

-- CreateIndex
CREATE UNIQUE INDEX "Animal_brinco_key" ON "Animal"("brinco");

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_raca_id_fkey" FOREIGN KEY ("raca_id") REFERENCES "Raca"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "Lote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_mae_id_fkey" FOREIGN KEY ("mae_id") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_pai_id_fkey" FOREIGN KEY ("pai_id") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_fazenda_origem_id_fkey" FOREIGN KEY ("fazenda_origem_id") REFERENCES "Fazenda"("id") ON DELETE SET NULL ON UPDATE CASCADE;
