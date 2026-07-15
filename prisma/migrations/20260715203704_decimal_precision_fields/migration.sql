/*
  Warnings:

  - You are about to alter the column `birth_weight_kg` on the `animal` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `current_weight_kg` on the `animal` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,2)`.
  - You are about to alter the column `hectares` on the `area` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `stocking_rate` on the `area` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `total_area` on the `property` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.
  - You are about to alter the column `productive_area` on the `property` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(10,4)`.

*/
-- AlterTable
ALTER TABLE "animal" ALTER COLUMN "birth_weight_kg" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "current_weight_kg" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "area" ALTER COLUMN "hectares" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "stocking_rate" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "property" ALTER COLUMN "total_area" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "productive_area" SET DATA TYPE DECIMAL(10,4);
