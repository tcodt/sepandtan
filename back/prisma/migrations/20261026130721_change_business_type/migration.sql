/*
  Warnings:

  - The `business_type` column on the `stores` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('LEGAL', 'INDIVIDUAL');

-- AlterTable
ALTER TABLE "stores" DROP COLUMN "business_type",
ADD COLUMN     "business_type" "BusinessType" NOT NULL DEFAULT 'INDIVIDUAL';
