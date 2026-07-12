-- CreateTable
CREATE TABLE "property" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "total_area" DOUBLE PRECISION,
    "productive_area" DOUBLE PRECISION,
    "cib" TEXT,
    "ccir" TEXT,
    "car" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "address_id" INTEGER,
    "owner_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "property_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "property_cib_key" ON "property"("cib");

-- CreateIndex
CREATE UNIQUE INDEX "property_ccir_key" ON "property"("ccir");

-- CreateIndex
CREATE UNIQUE INDEX "property_car_key" ON "property"("car");

-- CreateIndex
CREATE UNIQUE INDEX "property_address_id_key" ON "property"("address_id");

-- CreateIndex
CREATE INDEX "property_name_idx" ON "property"("name");

-- CreateIndex
CREATE INDEX "property_owner_id_idx" ON "property"("owner_id");

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "address"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property" ADD CONSTRAINT "property_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
