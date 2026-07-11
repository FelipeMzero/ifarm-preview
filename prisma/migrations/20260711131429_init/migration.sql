-- CreateEnum
CREATE TYPE "sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "animal_origin" AS ENUM ('BIRTH', 'PURCHASE', 'TRANSFER');

-- CreateEnum
CREATE TYPE "animal_status" AS ENUM ('ACTIVE', 'SOLD', 'DEAD', 'TRANSFERRED', 'DISCARDED', 'SLAUGHTERED');

-- CreateEnum
CREATE TYPE "person_type" AS ENUM ('INDIVIDUAL', 'COMPANY');

-- CreateEnum
CREATE TYPE "marital_status" AS ENUM ('SINGLE', 'MARRIED', 'STABLE_UNION', 'DIVORCED', 'WIDOWED');

-- CreateTable
CREATE TABLE "address" (
    "id" SERIAL NOT NULL,
    "zip_code" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "number" TEXT,
    "complement" TEXT,
    "neighborhood" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'Brasil',

    CONSTRAINT "address_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "person" (
    "id" TEXT NOT NULL,
    "type" "person_type" NOT NULL,
    "tax_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state_registration" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address_id" INTEGER,
    "trade_name" TEXT,
    "rg" TEXT,
    "birth_date" DATE,
    "marital_status" "marital_status",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deactivated_at" TIMESTAMP(3),

    CONSTRAINT "person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breed" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "breed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "batch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farm" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animal" (
    "id" TEXT NOT NULL,
    "ear_tag" TEXT NOT NULL,
    "rfid" TEXT,
    "name" TEXT,
    "birth_date" DATE,
    "birth_weight_kg" DOUBLE PRECISION,
    "sex" "sex" NOT NULL DEFAULT 'MALE',
    "origin" "animal_origin" NOT NULL DEFAULT 'BIRTH',
    "status" "animal_status" NOT NULL DEFAULT 'ACTIVE',
    "breed_id" INTEGER,
    "batch_id" INTEGER,
    "mother_id" TEXT,
    "father_id" TEXT,
    "origin_farm_id" INTEGER,
    "origin_farm_name" TEXT,
    "acquisition_date" DATE,
    "purchase_price" DECIMAL(10,2),
    "entry_age_months" INTEGER,
    "current_weight_kg" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" TEXT,
    "banned" BOOLEAN DEFAULT false,
    "ban_reason" TEXT,
    "ban_expires" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "impersonated_by" TEXT,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "id_token" TEXT,
    "scope" TEXT,
    "password" TEXT,
    "access_token_expires_at" TIMESTAMP(3),
    "refresh_token_expires_at" TIMESTAMP(3),
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "person_tax_id_key" ON "person"("tax_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_state_registration_key" ON "person"("state_registration");

-- CreateIndex
CREATE UNIQUE INDEX "person_email_key" ON "person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "person_address_id_key" ON "person"("address_id");

-- CreateIndex
CREATE UNIQUE INDEX "person_rg_key" ON "person"("rg");

-- CreateIndex
CREATE INDEX "person_type_idx" ON "person"("type");

-- CreateIndex
CREATE INDEX "person_name_idx" ON "person"("name");

-- CreateIndex
CREATE UNIQUE INDEX "breed_name_key" ON "breed"("name");

-- CreateIndex
CREATE UNIQUE INDEX "batch_name_key" ON "batch"("name");

-- CreateIndex
CREATE UNIQUE INDEX "farm_name_key" ON "farm"("name");

-- CreateIndex
CREATE UNIQUE INDEX "animal_ear_tag_key" ON "animal"("ear_tag");

-- CreateIndex
CREATE UNIQUE INDEX "animal_rfid_key" ON "animal"("rfid");

-- CreateIndex
CREATE INDEX "animal_batch_id_idx" ON "animal"("batch_id");

-- CreateIndex
CREATE INDEX "animal_breed_id_idx" ON "animal"("breed_id");

-- CreateIndex
CREATE INDEX "animal_status_idx" ON "animal"("status");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- AddForeignKey
ALTER TABLE "person" ADD CONSTRAINT "person_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breed"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_mother_id_fkey" FOREIGN KEY ("mother_id") REFERENCES "animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_father_id_fkey" FOREIGN KEY ("father_id") REFERENCES "animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_origin_farm_id_fkey" FOREIGN KEY ("origin_farm_id") REFERENCES "farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
