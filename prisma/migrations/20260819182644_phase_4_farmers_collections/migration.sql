-- CreateEnum
CREATE TYPE "FarmerRegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "CollectionSession" AS ENUM ('MORNING', 'EVENING');

-- CreateTable
CREATE TABLE "farmers" (
    "id" UUID NOT NULL,
    "farmer_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "village" TEXT,
    "district" TEXT,
    "registration_status" "FarmerRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "collection_center_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "animals" (
    "id" UUID NOT NULL,
    "farmer_id" UUID NOT NULL,
    "species_id" TEXT,
    "breed_id" TEXT,
    "identifier" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "approximate_age" INTEGER,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "animals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milk_collections" (
    "id" UUID NOT NULL,
    "collection_code" TEXT NOT NULL,
    "farmer_id" UUID NOT NULL,
    "facility_id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "session" "CollectionSession" NOT NULL,
    "quantity_liters" DECIMAL(10,2) NOT NULL,
    "collection_timestamp" TIMESTAMP(3) NOT NULL,
    "batch_id" UUID,
    "status" "EntityStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "milk_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quality_measurements" (
    "id" UUID NOT NULL,
    "collection_id" UUID NOT NULL,
    "batch_id" UUID,
    "fat_percent" DECIMAL(5,2),
    "snf_percent" DECIMAL(5,2),
    "density" DECIMAL(5,2),
    "temperature" DECIMAL(5,2),
    "water_estimate" DECIMAL(5,2),
    "other_parameters" JSONB,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_id" TEXT,
    "operator_id" UUID,

    CONSTRAINT "quality_measurements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "farmers_farmer_code_key" ON "farmers"("farmer_code");

-- CreateIndex
CREATE INDEX "farmers_collection_center_id_idx" ON "farmers"("collection_center_id");

-- CreateIndex
CREATE INDEX "animals_farmer_id_idx" ON "animals"("farmer_id");

-- CreateIndex
CREATE UNIQUE INDEX "milk_collections_collection_code_key" ON "milk_collections"("collection_code");

-- CreateIndex
CREATE INDEX "milk_collections_farmer_id_idx" ON "milk_collections"("farmer_id");

-- CreateIndex
CREATE INDEX "milk_collections_facility_id_idx" ON "milk_collections"("facility_id");

-- CreateIndex
CREATE INDEX "milk_collections_operator_id_idx" ON "milk_collections"("operator_id");

-- CreateIndex
CREATE INDEX "quality_measurements_collection_id_idx" ON "quality_measurements"("collection_id");

-- CreateIndex
CREATE INDEX "quality_measurements_batch_id_idx" ON "quality_measurements"("batch_id");

-- CreateIndex
CREATE INDEX "quality_measurements_operator_id_idx" ON "quality_measurements"("operator_id");

-- AddForeignKey
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_collection_center_id_fkey" FOREIGN KEY ("collection_center_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "animals" ADD CONSTRAINT "animals_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milk_collections" ADD CONSTRAINT "milk_collections_farmer_id_fkey" FOREIGN KEY ("farmer_id") REFERENCES "farmers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milk_collections" ADD CONSTRAINT "milk_collections_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milk_collections" ADD CONSTRAINT "milk_collections_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_measurements" ADD CONSTRAINT "quality_measurements_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "milk_collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quality_measurements" ADD CONSTRAINT "quality_measurements_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
