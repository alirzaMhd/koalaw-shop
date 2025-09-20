/*
  Warnings:

  - The values [other] on the enum `gender_enum` will be removed. If these variants are still used in the database, this will fail.
  - The primary key for the `user_notification_prefs` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `user_id` on the `user_notification_prefs` table. All the data in the column will be lost.
  - Added the required column `userId` to the `user_notification_prefs` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."gender_enum_new" AS ENUM ('undisclosed', 'male', 'female');
ALTER TABLE "public"."users" ALTER COLUMN "gender" DROP DEFAULT;
ALTER TABLE "public"."users" ALTER COLUMN "gender" TYPE "public"."gender_enum_new" USING ("gender"::text::"public"."gender_enum_new");
ALTER TYPE "public"."gender_enum" RENAME TO "gender_enum_old";
ALTER TYPE "public"."gender_enum_new" RENAME TO "gender_enum";
DROP TYPE "public"."gender_enum_old";
ALTER TABLE "public"."users" ALTER COLUMN "gender" SET DEFAULT 'undisclosed';
COMMIT;

-- DropForeignKey
ALTER TABLE "public"."cart_items" DROP CONSTRAINT "cart_items_cart_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."cart_items" DROP CONSTRAINT "cart_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."cart_items" DROP CONSTRAINT "cart_items_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."carts" DROP CONSTRAINT "carts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."collection_products" DROP CONSTRAINT "collection_products_collection_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."collection_products" DROP CONSTRAINT "collection_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."coupon_redemptions" DROP CONSTRAINT "coupon_redemptions_coupon_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."coupon_redemptions" DROP CONSTRAINT "coupon_redemptions_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."coupon_redemptions" DROP CONSTRAINT "coupon_redemptions_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."magazine_post_tags" DROP CONSTRAINT "magazine_post_tags_post_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."magazine_post_tags" DROP CONSTRAINT "magazine_post_tags_tag_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."magazine_posts" DROP CONSTRAINT "magazine_posts_author_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."magazine_related_posts" DROP CONSTRAINT "magazine_related_posts_post_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."magazine_related_posts" DROP CONSTRAINT "magazine_related_posts_related_post_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."order_items" DROP CONSTRAINT "order_items_variant_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."orders" DROP CONSTRAINT "orders_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."payments" DROP CONSTRAINT "payments_order_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_images" DROP CONSTRAINT "product_images_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_reviews" DROP CONSTRAINT "product_reviews_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_reviews" DROP CONSTRAINT "product_reviews_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."product_variants" DROP CONSTRAINT "product_variants_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_brand_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."products" DROP CONSTRAINT "products_color_theme_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."related_products" DROP CONSTRAINT "related_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."related_products" DROP CONSTRAINT "related_products_related_product_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_addresses" DROP CONSTRAINT "user_addresses_user_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_notification_prefs" DROP CONSTRAINT "user_notification_prefs_user_id_fkey";

-- DropIndex
DROP INDEX "public"."idx_cart_items_cart";

-- DropIndex
DROP INDEX "public"."idx_coupon_redemptions_user";

-- DropIndex
DROP INDEX "public"."idx_coupons_window";

-- DropIndex
DROP INDEX "public"."idx_mag_posts_category_pub";

-- DropIndex
DROP INDEX "public"."idx_mag_posts_title_trgm";

-- DropIndex
DROP INDEX "public"."idx_order_items_order";

-- DropIndex
DROP INDEX "public"."idx_orders_status";

-- DropIndex
DROP INDEX "public"."idx_orders_user";

-- DropIndex
DROP INDEX "public"."idx_payments_order";

-- DropIndex
DROP INDEX "public"."idx_payments_status";

-- DropIndex
DROP INDEX "public"."idx_reviews_product";

-- DropIndex
DROP INDEX "public"."idx_reviews_status";

-- DropIndex
DROP INDEX "public"."idx_products_brand";

-- DropIndex
DROP INDEX "public"."idx_products_category_price";

-- DropIndex
DROP INDEX "public"."idx_products_color_theme";

-- DropIndex
DROP INDEX "public"."idx_products_title_trgm";

-- DropIndex
DROP INDEX "public"."idx_related_products_product_id";

-- AlterTable
ALTER TABLE "public"."user_notification_prefs" DROP CONSTRAINT "user_notification_prefs_pkey",
DROP COLUMN "user_id",
ADD COLUMN     "userId" UUID NOT NULL,
ADD CONSTRAINT "user_notification_prefs_pkey" PRIMARY KEY ("userId");

-- AddForeignKey
ALTER TABLE "public"."user_notification_prefs" ADD CONSTRAINT "user_notification_prefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_color_theme_id_fkey" FOREIGN KEY ("color_theme_id") REFERENCES "public"."color_themes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_reviews" ADD CONSTRAINT "product_reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."product_reviews" ADD CONSTRAINT "product_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collection_products" ADD CONSTRAINT "collection_products_collection_id_fkey" FOREIGN KEY ("collection_id") REFERENCES "public"."collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."collection_products" ADD CONSTRAINT "collection_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."related_products" ADD CONSTRAINT "related_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."related_products" ADD CONSTRAINT "related_products_related_product_id_fkey" FOREIGN KEY ("related_product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."carts" ADD CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_cart_id_fkey" FOREIGN KEY ("cart_id") REFERENCES "public"."carts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."payments" ADD CONSTRAINT "payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."coupon_redemptions" ADD CONSTRAINT "coupon_redemptions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_addresses" ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."magazine_posts" ADD CONSTRAINT "magazine_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."magazine_authors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."magazine_post_tags" ADD CONSTRAINT "magazine_post_tags_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."magazine_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."magazine_post_tags" ADD CONSTRAINT "magazine_post_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."magazine_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."magazine_related_posts" ADD CONSTRAINT "magazine_related_posts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."magazine_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."magazine_related_posts" ADD CONSTRAINT "magazine_related_posts_related_post_id_fkey" FOREIGN KEY ("related_post_id") REFERENCES "public"."magazine_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
