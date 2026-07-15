/*
  Warnings:

  - You are about to drop the column `deleted_at` on the `animal` table. All the data in the column will be lost.
  - You are about to drop the column `origin_farm_id` on the `animal` table. All the data in the column will be lost.
  - You are about to drop the column `origin_farm_name` on the `animal` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `area` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `breed` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `person` table. All the data in the column will be lost.
  - You are about to drop the column `deleted_at` on the `property` table. All the data in the column will be lost.
  - You are about to drop the `farm` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "animal" DROP CONSTRAINT "animal_batch_id_fkey";

-- DropForeignKey
ALTER TABLE "animal" DROP CONSTRAINT "animal_breed_id_fkey";

-- DropForeignKey
ALTER TABLE "animal" DROP CONSTRAINT "animal_father_id_fkey";

-- DropForeignKey
ALTER TABLE "animal" DROP CONSTRAINT "animal_mother_id_fkey";

-- DropForeignKey
ALTER TABLE "animal" DROP CONSTRAINT "animal_origin_farm_id_fkey";

-- AlterTable
ALTER TABLE "animal" DROP COLUMN "deleted_at",
DROP COLUMN "origin_farm_id",
DROP COLUMN "origin_farm_name",
ADD COLUMN     "origin_property_id" UUID,
ADD COLUMN     "origin_property_name" TEXT;

-- AlterTable
ALTER TABLE "area" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "breed" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "person" DROP COLUMN "deleted_at";

-- AlterTable
ALTER TABLE "property" DROP COLUMN "deleted_at",
ADD COLUMN     "deactivated_at" TIMESTAMP(3);

-- DropTable
DROP TABLE "farm";

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_breed_id_fkey" FOREIGN KEY ("breed_id") REFERENCES "breed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_mother_id_fkey" FOREIGN KEY ("mother_id") REFERENCES "animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_father_id_fkey" FOREIGN KEY ("father_id") REFERENCES "animal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animal" ADD CONSTRAINT "animal_origin_property_id_fkey" FOREIGN KEY ("origin_property_id") REFERENCES "property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
