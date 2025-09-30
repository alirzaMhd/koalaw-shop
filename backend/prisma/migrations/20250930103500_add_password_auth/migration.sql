/*
  Warnings:

  - You are about to drop the `otp_codes` table. If the table is not empty, all the data it contains will be lost.
  - Modified the `users` table to support email/password authentication while keeping existing phone users.

*/

-- Step 1: Add new columns as NULLABLE first
ALTER TABLE "public"."users" 
ADD COLUMN IF NOT EXISTS "email_verified_at" TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS "password_hash" TEXT,
ALTER COLUMN "phone" DROP NOT NULL;

-- Step 2: Make email nullable (in case it wasn't already)
ALTER TABLE "public"."users" 
ALTER COLUMN "email" DROP NOT NULL;

-- Step 3: For existing users with phone but no email, create temporary emails
-- This allows them to continue using phone-based auth while migration completes
UPDATE "public"."users" 
SET email = 'user_' || REPLACE(phone, '+', '') || '@migration.temp'
WHERE email IS NULL AND phone IS NOT NULL;

-- Step 4: For any remaining users without email or phone, set a fallback
UPDATE "public"."users" 
SET email = 'user_' || id || '@migration.temp'
WHERE email IS NULL;

-- Step 5: For existing users without password_hash, set a secure random hash
-- They won't be able to login with password until they set one
UPDATE "public"."users" 
SET password_hash = '$2b$12$' || MD5(random()::text || id::text)
WHERE password_hash IS NULL;

-- Step 6: Now make the columns NOT NULL
ALTER TABLE "public"."users" 
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "password_hash" SET NOT NULL;

-- Step 7: Create unique index on email
DROP INDEX IF EXISTS "public"."users_email_key";
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- Step 8: Drop the OTP table
DROP TABLE IF EXISTS "public"."otp_codes";

-- Step 9: Drop the OTP enum
DROP TYPE IF EXISTS "public"."otp_purpose_enum";

-- Step 10: Add comment to track migration users
COMMENT ON COLUMN "public"."users"."email" IS 'Email address - may be temporary for migrated phone-only users';