/*
  Warnings:

  - You are about to drop the column `onboarding_completed` on the `Profile` table. All the data in the column will be lost.
  - The `status` column on the `stores` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "OnBoardingStep" AS ENUM ('PROFILE', 'EQUIPMENT', 'TRAINING_GOAL', 'DONE');

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "onboarding_completed",
ADD COLUMN     "on_boarding_step" "OnBoardingStep" NOT NULL DEFAULT 'PROFILE';

-- AlterTable
ALTER TABLE "stores" DROP COLUMN "status",
ADD COLUMN     "status" "AccountStatus" NOT NULL DEFAULT 'PENDING';
