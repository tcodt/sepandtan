/*
  Warnings:

  - You are about to drop the column `plan_request_id` on the `coach_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `snapshot_version` on the `user_plans` table. All the data in the column will be lost.
  - You are about to drop the column `isEmailVerified` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `isPhoneVerified` on the `users` table. All the data in the column will be lost.
  - Added the required column `diet_rating` to the `coach_reviews` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StatusDiscount" ADD VALUE 'COACH';
ALTER TYPE "StatusDiscount" ADD VALUE 'PLAN';

-- DropForeignKey
ALTER TABLE "coach_reviews" DROP CONSTRAINT "coach_reviews_plan_request_id_fkey";

-- AlterTable
ALTER TABLE "coach_reviews" DROP COLUMN "plan_request_id",
ADD COLUMN     "diet_rating" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "plan_requests" ADD COLUMN     "commission_rate" DECIMAL(18,2),
ADD COLUMN     "discount_amount" DECIMAL(18,2),
ADD COLUMN     "images" TEXT[];

-- AlterTable
ALTER TABLE "user_plans" DROP COLUMN "snapshot_version";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "isEmailVerified",
DROP COLUMN "isPhoneVerified",
ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_phone_verified" BOOLEAN NOT NULL DEFAULT false;
