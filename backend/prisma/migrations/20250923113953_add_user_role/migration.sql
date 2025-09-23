-- CreateEnum
CREATE TYPE "public"."user_role_enum" AS ENUM ('customer', 'admin', 'staff');

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "role" "public"."user_role_enum" NOT NULL DEFAULT 'customer';
