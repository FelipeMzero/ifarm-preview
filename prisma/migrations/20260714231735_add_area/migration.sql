-- CreateTable
CREATE TABLE "area" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "polygon" JSONB NOT NULL,
    "hectares" DOUBLE PRECISION NOT NULL,
    "stocking_rate" DOUBLE PRECISION NOT NULL,
    "notes" TEXT,
    "property_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "deactivated_at" TIMESTAMP(3),

    CONSTRAINT "area_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "area_property_id_idx" ON "area"("property_id");

-- AddForeignKey
ALTER TABLE "area" ADD CONSTRAINT "area_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
