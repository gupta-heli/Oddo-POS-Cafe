/*
  Warnings:

  - A unique constraint covering the columns `[selfOrderToken]` on the table `Table` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "sendToKitchen" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Table" ADD COLUMN     "selfOrderToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Table_selfOrderToken_key" ON "Table"("selfOrderToken");
