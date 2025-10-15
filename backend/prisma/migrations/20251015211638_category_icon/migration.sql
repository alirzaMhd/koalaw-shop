-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "icon" VARCHAR(50) NOT NULL DEFAULT 'grid';

-- DropEnum
DROP TYPE "public"."product_category_enum";
