/*
  Warnings:

  - You are about to drop the column `category` on the `magazine_posts` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `magazine_posts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "magazine_posts" DROP COLUMN "category",
ADD COLUMN     "category_id" UUID NOT NULL;

-- DropEnum
DROP TYPE "public"."magazine_category_enum";

-- CreateTable
CREATE TABLE "magazine_categories" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "slug" VARCHAR(64) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "magazine_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "magazine_categories_code_key" ON "magazine_categories"("code");

-- CreateIndex
CREATE UNIQUE INDEX "magazine_categories_slug_key" ON "magazine_categories"("slug");

-- AddForeignKey
ALTER TABLE "magazine_posts" ADD CONSTRAINT "magazine_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "magazine_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
