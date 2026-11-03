/*
  Warnings:

  - You are about to drop the column `issued_at` on the `certifications` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `certifications` table. All the data in the column will be lost.
  - You are about to drop the column `verified_at` on the `certifications` table. All the data in the column will be lost.
  - You are about to drop the column `verified_at` on the `coach_achievements` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "certifications_status_idx";

-- AlterTable
ALTER TABLE "certifications" DROP COLUMN "issued_at",
DROP COLUMN "status",
DROP COLUMN "verified_at",
ADD COLUMN     "is_verified" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "coach_achievements" DROP COLUMN "verified_at";
