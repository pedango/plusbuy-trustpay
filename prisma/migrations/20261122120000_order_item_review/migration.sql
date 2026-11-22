-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "orderedQuantity" INTEGER;
UPDATE "OrderItem" SET "orderedQuantity" = "quantity" WHERE "orderedQuantity" IS NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "orderedQuantity" SET NOT NULL;
ALTER TABLE "OrderItem" ADD COLUMN "buyerComment" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "buyerImageUrl" TEXT;
