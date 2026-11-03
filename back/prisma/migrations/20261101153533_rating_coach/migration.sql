/*
  Warnings:

  - You are about to drop the column `is_verified` on the `certifications` table. All the data in the column will be lost.
  - You are about to drop the column `authorId` on the `coach_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `coachId` on the `coach_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `comment` on the `coach_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `coach_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `planRequestId` on the `coach_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `coach_reviews` table. All the data in the column will be lost.
  - You are about to drop the column `address` on the `coaches` table. All the data in the column will be lost.
  - You are about to drop the column `rating_avg` on the `coaches` table. All the data in the column will be lost.
  - You are about to drop the column `rating_count` on the `coaches` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[coach_id,author_id]` on the table `coach_reviews` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `coaches` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `certifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `certifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `author_id` to the `coach_reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coach_id` to the `coach_reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coach_rating` to the `coach_reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plan_rating` to the `coach_reviews` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `coaches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `workout_plans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE', 'DELETED');

-- CreateEnum
CREATE TYPE "CertificationType" AS ENUM ('ACADEMIC', 'PROFESSIONAL', 'FEDERATION', 'WORKSHOP', 'OTHER');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('MEDAL', 'TROPHY', 'TITLE', 'AWARD', 'RECORD', 'OTHER');

-- CreateEnum
CREATE TYPE "AchievementScope" AS ENUM ('LOCAL', 'NATIONAL', 'INTERNATIONAL', 'ACADEMIC', 'OTHER');

-- AlterEnum
ALTER TYPE "MediaUseCase" ADD VALUE 'REVIEW';

-- DropForeignKey
ALTER TABLE "coach_reviews" DROP CONSTRAINT "coach_reviews_authorId_fkey";

-- DropForeignKey
ALTER TABLE "coach_reviews" DROP CONSTRAINT "coach_reviews_coachId_fkey";

-- DropForeignKey
ALTER TABLE "coach_reviews" DROP CONSTRAINT "coach_reviews_planRequestId_fkey";

-- DropIndex
DROP INDEX "coach_reviews_coachId_authorId_key";

-- DropIndex
DROP INDEX "coach_reviews_coachId_idx";

-- DropIndex
DROP INDEX "coaches_rating_avg_idx";

-- AlterTable
ALTER TABLE "certifications" DROP COLUMN "is_verified",
ADD COLUMN     "field" TEXT,
ADD COLUMN     "is_primary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "status" "DefaultStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "type" "CertificationType" NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "coach_reviews" DROP COLUMN "authorId",
DROP COLUMN "coachId",
DROP COLUMN "comment",
DROP COLUMN "createdAt",
DROP COLUMN "planRequestId",
DROP COLUMN "rating",
ADD COLUMN     "answered_at" TIMESTAMP(3),
ADD COLUMN     "author_id" UUID NOT NULL,
ADD COLUMN     "body" TEXT,
ADD COLUMN     "coach_id" TEXT NOT NULL,
ADD COLUMN     "coach_rating" INTEGER NOT NULL,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "dislike_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "like_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plan_rating" INTEGER NOT NULL,
ADD COLUMN     "plan_request_id" TEXT,
ADD COLUMN     "user_plan_id" TEXT,
ADD COLUMN     "verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "coaches" DROP COLUMN "address",
DROP COLUMN "rating_avg",
DROP COLUMN "rating_count",
ADD COLUMN     "address_id" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "exercises" ADD COLUMN     "extra_data" JSONB;

-- AlterTable
ALTER TABLE "tokens" ALTER COLUMN "expired_date" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "workout_plans" ADD COLUMN     "status" "StatusProduct" NOT NULL;

-- CreateTable
CREATE TABLE "coach_achievements" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL DEFAULT 'MEDAL',
    "scope" "AchievementScope" NOT NULL DEFAULT 'NATIONAL',
    "issuer" TEXT,
    "place" INTEGER,
    "year" INTEGER,
    "event_name" TEXT,
    "description" TEXT,
    "document_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_ratings" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "avg_coach_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coach_rating_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "avg_plan_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "plan_rating_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "completed_clients" INTEGER NOT NULL DEFAULT 0,
    "active_clients" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "review_id" TEXT NOT NULL,
    "type" "ReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "coach_achievements_coach_id_idx" ON "coach_achievements"("coach_id");

-- CreateIndex
CREATE INDEX "coach_achievements_coach_id_is_verified_idx" ON "coach_achievements"("coach_id", "is_verified");

-- CreateIndex
CREATE INDEX "coach_achievements_year_idx" ON "coach_achievements"("year");

-- CreateIndex
CREATE UNIQUE INDEX "coach_ratings_coach_id_key" ON "coach_ratings"("coach_id");

-- CreateIndex
CREATE INDEX "coach_ratings_avg_coach_rating_idx" ON "coach_ratings"("avg_coach_rating");

-- CreateIndex
CREATE INDEX "coach_ratings_avg_plan_rating_idx" ON "coach_ratings"("avg_plan_rating");

-- CreateIndex
CREATE INDEX "coach_ratings_total_reviews_idx" ON "coach_ratings"("total_reviews");

-- CreateIndex
CREATE INDEX "reactions_review_id_type_idx" ON "reactions"("review_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_user_id_review_id_key" ON "reactions"("user_id", "review_id");

-- CreateIndex
CREATE INDEX "certifications_coach_id_type_idx" ON "certifications"("coach_id", "type");

-- CreateIndex
CREATE INDEX "certifications_status_idx" ON "certifications"("status");

-- CreateIndex
CREATE INDEX "checkouts_payment_status_status_created_at_idx" ON "checkouts"("payment_status", "status", "created_at");

-- CreateIndex
CREATE INDEX "coach_reviews_coach_id_status_idx" ON "coach_reviews"("coach_id", "status");

-- CreateIndex
CREATE INDEX "coach_reviews_author_id_idx" ON "coach_reviews"("author_id");

-- CreateIndex
CREATE INDEX "coach_reviews_created_at_idx" ON "coach_reviews"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "coach_reviews_coach_id_author_id_key" ON "coach_reviews"("coach_id", "author_id");

-- CreateIndex
CREATE UNIQUE INDEX "coaches_slug_key" ON "coaches"("slug");

-- AddForeignKey
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_achievements" ADD CONSTRAINT "coach_achievements_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_ratings" ADD CONSTRAINT "coach_ratings_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_reviews" ADD CONSTRAINT "coach_reviews_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_reviews" ADD CONSTRAINT "coach_reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_reviews" ADD CONSTRAINT "coach_reviews_plan_request_id_fkey" FOREIGN KEY ("plan_request_id") REFERENCES "plan_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_reviews" ADD CONSTRAINT "coach_reviews_user_plan_id_fkey" FOREIGN KEY ("user_plan_id") REFERENCES "user_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "coach_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
