-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "tax" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
ADD COLUMN     "unit" TEXT NOT NULL DEFAULT 'pcs';

-- CreateTable
CREATE TABLE "Variant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "extraPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,

    CONSTRAINT "Variant_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
