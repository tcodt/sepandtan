/*
  Warnings:

  - A unique constraint covering the columns `[referral_code]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "ServiceOrderType" AS ENUM ('PLAN', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'CANCELLED', 'FAILED');

-- AlterEnum
ALTER TYPE "WalletTransactionType" ADD VALUE 'REFERRAL_BONUS';

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "service_order_id" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "referral_code" TEXT,
ADD COLUMN     "referred_at" TIMESTAMP(3),
ADD COLUMN     "referred_by_id" UUID;

-- CreateTable
CREATE TABLE "service_orders" (
    "id" TEXT NOT NULL,
    "type" "ServiceOrderType" NOT NULL,
    "status" "ServiceOrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "user_id" UUID NOT NULL,
    "coach_id" TEXT,
    "plan_request_id" TEXT,
    "subscription_id" TEXT,
    "original_amount" DECIMAL(18,2) NOT NULL,
    "discount_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "commission_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "referral_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "payable_amount" DECIMAL(18,2) NOT NULL,
    "coach_net_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discount_code_id" TEXT,
    "snapshot" JSONB NOT NULL,
    "paid_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_code_coaches" (
    "discount_code_id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,

    CONSTRAINT "discount_code_coaches_pkey" PRIMARY KEY ("discount_code_id","coach_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_plan_request_id_key" ON "service_orders"("plan_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_orders_subscription_id_key" ON "service_orders"("subscription_id");

-- CreateIndex
CREATE INDEX "service_orders_user_id_status_idx" ON "service_orders"("user_id", "status");

-- CreateIndex
CREATE INDEX "service_orders_coach_id_status_idx" ON "service_orders"("coach_id", "status");

-- CreateIndex
CREATE INDEX "service_orders_type_status_idx" ON "service_orders"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_referral_code_idx" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_referred_by_id_idx" ON "users"("referred_by_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_id_fkey" FOREIGN KEY ("referred_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_plan_request_id_fkey" FOREIGN KEY ("plan_request_id") REFERENCES "plan_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_coaches" ADD CONSTRAINT "discount_code_coaches_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_coaches" ADD CONSTRAINT "discount_code_coaches_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
