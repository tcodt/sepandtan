/*
  Warnings:

  - You are about to drop the column `cityId` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `provinceId` on the `addresses` table. All the data in the column will be lost.
  - You are about to drop the column `name_en` on the `cities` table. All the data in the column will be lost.
  - You are about to drop the column `store_name_en` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `name_en` on the `provinces` table. All the data in the column will be lost.
  - You are about to drop the column `name_en` on the `shipping_methods` table. All the data in the column will be lost.
  - You are about to drop the column `description_en` on the `store_shipping_methods` table. All the data in the column will be lost.
  - Added the required column `city_id` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `province_id` to the `addresses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expired_date` to the `tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_cityId_fkey";

-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_provinceId_fkey";

-- AlterTable
ALTER TABLE "addresses" DROP COLUMN "cityId",
DROP COLUMN "provinceId",
ADD COLUMN     "city_id" TEXT NOT NULL,
ADD COLUMN     "province_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "cities" DROP COLUMN "name_en";

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "store_name_en";

-- AlterTable
ALTER TABLE "provinces" DROP COLUMN "name_en";

-- AlterTable
ALTER TABLE "shipping_methods" DROP COLUMN "name_en";

-- AlterTable
ALTER TABLE "store_shipping_methods" DROP COLUMN "description_en";

-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "expired_date" DATE NOT NULL;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
