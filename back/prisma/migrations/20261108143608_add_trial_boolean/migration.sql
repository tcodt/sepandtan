/*
  Warnings:

  - A unique constraint covering the columns `[coach_id,weekday]` on the table `coach_availabilities` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SubscriptionPlanType" AS ENUM ('USER', 'COACH', 'STORE');

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'TRIALING';

-- AlterTable
ALTER TABLE "SubscriptionPlan" ADD COLUMN     "type" "SubscriptionPlanType" NOT NULL DEFAULT 'USER';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "has_used_trial" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "coach_availabilities_coach_id_weekday_key" ON "coach_availabilities"("coach_id", "weekday");
