-- CreateEnum
CREATE TYPE "StatusProduct" AS ENUM ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'INACTIVE', 'OUT_OF_STOCK', 'DELETED', 'BANNED');

-- CreateEnum
CREATE TYPE "RolePerson" AS ENUM ('USER', 'ADMIN', 'SUPERADMIN', 'AUTHOR', 'COACH', 'STORE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'TRIALING', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'BOTH', 'OTHER');

-- CreateEnum
CREATE TYPE "ActivityLevel" AS ENUM ('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE');

-- CreateEnum
CREATE TYPE "ExperienceLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "TrainingLocation" AS ENUM ('HOME', 'GYM', 'BOTH');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('REGISTER', 'LOGIN', 'RESET_PASSWORD');

-- CreateEnum
CREATE TYPE "BusinessType" AS ENUM ('LEGAL', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "DefaultStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED');

-- CreateEnum
CREATE TYPE "StatusDiscount" AS ENUM ('PLATFORM', 'STORE', 'COMMISSION', 'PRODUCT', 'COACH', 'PLAN');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'WALLET', 'COD', 'ZARINPAL');

-- CreateEnum
CREATE TYPE "Prioritytype" AS ENUM ('PRIMARY', 'SECONDARY', 'TERTIARY');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'ITEM_RECEIVED', 'REFUNDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "RefundMethod" AS ENUM ('WALLET', 'ORIGINAL_PAYMENT');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('DEPOSIT', 'WITHDRAW', 'COMMISSION', 'TAX', 'REFUND', 'PURCHASE', 'SALE_SETTLEMENT', 'RETURN_DEDUCTION', 'COACH_SETTLEMENT', 'SERVICE_PACKAGE', 'REFERRAL_BONUS');

-- CreateEnum
CREATE TYPE "WalletTransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('PERCENTAGE', 'FIXED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'WAITING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MediaUseCase" AS ENUM ('AVATAR', 'PRODUCT', 'POST', 'ATTACHMENT', 'THUMBNAIL', 'WATERMARK', 'REPORTS', 'MAINS', 'REVIEW');

-- CreateEnum
CREATE TYPE "TypeMedia" AS ENUM ('VIDEO', 'IMAGE', 'VOICE', 'FILE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportsStatus" AS ENUM ('PENDING', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED', 'DELETED');

-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlanType" AS ENUM ('WORKOUT', 'DIET', 'ALL');

-- CreateEnum
CREATE TYPE "PlanRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'PAID', 'DELIVERED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PlanSource" AS ENUM ('COACH', 'SITE', 'AI');

-- CreateEnum
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK');

-- CreateEnum
CREATE TYPE "CertificationType" AS ENUM ('ACADEMIC', 'PROFESSIONAL', 'FEDERATION', 'WORKSHOP', 'OTHER');

-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'DISLIKE');

-- CreateEnum
CREATE TYPE "AchievementType" AS ENUM ('MEDAL', 'TROPHY', 'TITLE', 'AWARD', 'RECORD', 'OTHER');

-- CreateEnum
CREATE TYPE "AchievementScope" AS ENUM ('LOCAL', 'NATIONAL', 'INTERNATIONAL', 'ACADEMIC', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceOrderType" AS ENUM ('PLAN', 'SUBSCRIPTION');

-- CreateEnum
CREATE TYPE "ServiceOrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "OnBoardingStep" AS ENUM ('PROFILE', 'EQUIPMENT', 'TRAINING_GOAL', 'DONE');

-- CreateEnum
CREATE TYPE "SubscriptionPlanType" AS ENUM ('USER', 'COACH', 'STORE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "referred_by_id" UUID,
    "email" TEXT,
    "name" TEXT NOT NULL,
    "avatar" TEXT,
    "password" TEXT,
    "googleId" TEXT,
    "phone" TEXT,
    "role" "RolePerson" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "referral_code" TEXT,
    "is_phone_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "has_used_trial" BOOLEAN NOT NULL DEFAULT false,
    "referred_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profile" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "avatar" TEXT,
    "first_name" TEXT,
    "last_name" TEXT,
    "height_cm" DECIMAL(7,2),
    "current_weight_kg" DECIMAL(7,2),
    "target_weight_kg" DECIMAL(7,2),
    "activity_level" "ActivityLevel",
    "experience_level" "ExperienceLevel",
    "gender" "Gender",
    "training_location" "TrainingLocation",
    "age" DATE,
    "training_days_per_week" INTEGER,
    "injuries" TEXT,
    "medical_conditions" TEXT,
    "allergies" TEXT[],
    "dietary_restrictions" TEXT[],
    "training_goal_id" TEXT,
    "on_boarding_step" "OnBoardingStep" NOT NULL DEFAULT 'PROFILE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "title" TEXT,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "province_id" TEXT NOT NULL,
    "city_id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "postal_code" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens" (
    "id" SERIAL NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device" TEXT,
    "ip_address" TEXT,
    "expired_date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_codes" (
    "id" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id")
);

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
    "commission_discount_amount" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discount_code_id" TEXT,
    "snapshot" JSONB NOT NULL,
    "paid_at" TIMESTAMP(3),
    "refunded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "SubscriptionPlanType" NOT NULL DEFAULT 'USER',
    "cover_img" TEXT,
    "price" DECIMAL(12,2) NOT NULL,
    "original_price" DECIMAL(12,2),
    "duration_days" INTEGER NOT NULL,
    "trial_days" INTEGER NOT NULL DEFAULT 0,
    "ai_plan_limit_per_month" INTEGER,
    "ai_chat_limit_per_day" INTEGER,
    "can_request_coach" BOOLEAN NOT NULL DEFAULT false,
    "can_track_progress" BOOLEAN NOT NULL DEFAULT true,
    "features" TEXT[],
    "is_popular" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "plan_id" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "pricePaid" DECIMAL(12,2) NOT NULL,
    "starts_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "muscle_groups" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,

    CONSTRAINT "muscle_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipments" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,

    CONSTRAINT "equipments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notic" TEXT[],
    "step_action" TEXT[],
    "category_id" TEXT,
    "level" "ExperienceLevel" NOT NULL DEFAULT 'BEGINNER',
    "duration_min" INTEGER,
    "calories_min" INTEGER,
    "calories_max" INTEGER,
    "gif_url" TEXT,
    "video_url" TEXT,
    "extra_data" JSONB,
    "cover_img" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "calories_per_100g" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "protein_per_100g" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "carbs_per_100g" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "fat_per_100g" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "specialties" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "specialties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "training_goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "sort_order" INTEGER DEFAULT 0,

    CONSTRAINT "training_goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coaches" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "province_id" TEXT,
    "national_id" TEXT,
    "city_id" TEXT,
    "address_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "instagram" TEXT,
    "commission_rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "max_clients" INTEGER NOT NULL DEFAULT 20,
    "is_accepting_clients" BOOLEAN NOT NULL DEFAULT true,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "experience_years" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coaches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_ratings" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "avg_coach_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "coach_rating_total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "avg_plan_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "plan_rating_total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "avg_diet_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "diet_rating_total" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "completed_clients" INTEGER NOT NULL DEFAULT 0,
    "active_clients" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_achievements" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "AchievementType" NOT NULL DEFAULT 'MEDAL',
    "scope" "AchievementScope" NOT NULL DEFAULT 'NATIONAL',
    "issuer" TEXT,
    "place" INTEGER,
    "event_name" TEXT,
    "description" TEXT,
    "document_url" TEXT,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "year" TIMESTAMP(3) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_achievements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "type" "CertificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "field" TEXT,
    "level" TEXT,
    "issuer" TEXT,
    "document_url" TEXT,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" DATE,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_availabilities" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_availabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_logs" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "user_plan_id" TEXT,
    "date" DATE NOT NULL,
    "weight_kg" DECIMAL(5,2),
    "jalali_year" INTEGER NOT NULL,
    "jalali_month" INTEGER NOT NULL,
    "un_completed_exercise_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "planned_exercises" INTEGER NOT NULL DEFAULT 0,
    "done_exercises" INTEGER NOT NULL DEFAULT 0,
    "extra_exercises" JSONB NOT NULL DEFAULT '[]',
    "calories_burned" INTEGER,
    "un_completed_meal_ids" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "planned_meals" INTEGER NOT NULL DEFAULT 0,
    "done_meals" INTEGER NOT NULL DEFAULT 0,
    "extra_meals" JSONB NOT NULL DEFAULT '[]',
    "calories_planned" INTEGER,
    "calories_consumed" INTEGER,
    "protein_g" INTEGER,
    "carbs_g" INTEGER,
    "fat_g" INTEGER,
    "user_note" TEXT,
    "coach_note" TEXT,
    "startimetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endtimeAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_plans" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "source" "PlanSource" NOT NULL DEFAULT 'COACH',
    "type" "PlanType" NOT NULL DEFAULT 'WORKOUT',
    "workout_plan_id" TEXT,
    "request_id" TEXT,
    "diet_plan_id" TEXT,
    "coach_id" TEXT,
    "snapshot_exercise" JSONB,
    "snapshot_diet" JSONB,
    "start_date" DATE,
    "end_date" DATE,
    "activated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "workout_weeks" INTEGER,
    "diet_weeks" INTEGER,
    "diet_start_date" DATE,

    CONSTRAINT "user_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plan_requests" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "coach_id" TEXT NOT NULL,
    "workout_template_id" TEXT,
    "diet_template_id" TEXT,
    "images" TEXT[],
    "note" TEXT,
    "discount_amount" DECIMAL(18,2),
    "price" DECIMAL(18,2),
    "original_price" DECIMAL(18,2),
    "status" "PlanRequestStatus" NOT NULL DEFAULT 'PENDING',
    "rejection_reason" TEXT,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plan_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_plans" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT,
    "diet_plan_id" TEXT,
    "cover_image" TEXT[],
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discount_price" DECIMAL(18,2),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "min_age" INTEGER,
    "max_age" INTEGER,
    "note" TEXT,
    "count_rating" INTEGER NOT NULL DEFAULT 0,
    "total_rating" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "duration_weeks" INTEGER,
    "source" "PlanSource" NOT NULL DEFAULT 'COACH',
    "training_goal_id" TEXT,
    "activity_level" "ActivityLevel",
    "level" "ExperienceLevel",
    "gender" "Gender",
    "training_location" "TrainingLocation",
    "days_per_week" INTEGER,
    "discount_expired" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workout_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_phases" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_week" INTEGER NOT NULL,
    "end_week" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "workout_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_days" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "workout_phase_id" TEXT,
    "day_index" INTEGER NOT NULL,
    "title" TEXT,
    "is_rest_day" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,

    CONSTRAINT "workout_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workout_day_exercises" (
    "id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "sets" INTEGER,
    "reps" TEXT,
    "duration_sec" INTEGER,
    "rest_sec" INTEGER,
    "notes" TEXT,

    CONSTRAINT "workout_day_exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_plans" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT,
    "cover_image" TEXT[],
    "title" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "discount_price" DECIMAL(18,2),
    "count_rating" INTEGER NOT NULL DEFAULT 0,
    "total_rating" INTEGER NOT NULL DEFAULT 0,
    "avg_rating" DECIMAL(3,2) NOT NULL DEFAULT 0,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "source" "PlanSource" NOT NULL DEFAULT 'COACH',
    "training_goal_id" TEXT,
    "target_calories" INTEGER,
    "target_protein_g" INTEGER,
    "target_carbs_g" INTEGER,
    "target_fat_g" INTEGER,
    "duration_weeks" INTEGER,
    "discount_expired" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "diet_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_phases" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "start_week" INTEGER NOT NULL,
    "end_week" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "target_calories" INTEGER,
    "target_protein_g" INTEGER,
    "target_carbs_g" INTEGER,
    "target_fat_g" INTEGER,

    CONSTRAINT "diet_phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_days" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "diet_phase_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "title" TEXT,
    "notes" TEXT,

    CONSTRAINT "diet_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_meals" (
    "id" TEXT NOT NULL,
    "day_id" TEXT NOT NULL,
    "type" "MealType" NOT NULL,
    "priority" "Prioritytype" NOT NULL DEFAULT 'PRIMARY',
    "order" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "diet_meals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "diet_meal_items" (
    "id" TEXT NOT NULL,
    "meal_id" TEXT NOT NULL,
    "food_id" TEXT NOT NULL,
    "quantity_grams" DECIMAL(6,2) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "diet_meal_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" TEXT NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "banner" TEXT,
    "description" TEXT,
    "business_type" "BusinessType" NOT NULL DEFAULT 'INDIVIDUAL',
    "national_id" TEXT,
    "economic_code" TEXT,
    "commission_rate" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "status_reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "instagram" TEXT,
    "telegram" TEXT,
    "whats_app" TEXT,
    "bale" TEXT,
    "robika" TEXT,
    "shipping_time" TEXT,
    "tax_rate" DECIMAL(5,2) NOT NULL DEFAULT 9,
    "working_hours" TEXT,
    "has_physical_store" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "province_id" TEXT,
    "city_id" TEXT,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_ratings" (
    "id" TEXT NOT NULL,
    "avg_rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "rating_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "product_count" INTEGER NOT NULL DEFAULT 0,
    "product_quality" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "product_quality_total" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "product_quality_count" INTEGER NOT NULL DEFAULT 0,
    "total_response_requests" INTEGER NOT NULL DEFAULT 0,
    "answered_responses" INTEGER NOT NULL DEFAULT 0,
    "total_response_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "response_rate" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "response_time" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sale_count" INTEGER NOT NULL DEFAULT 0,
    "return_count" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "seller_id" TEXT NOT NULL,

    CONSTRAINT "store_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "meta_title" TEXT,
    "content" JSONB,
    "description" TEXT NOT NULL,
    "original_price" DECIMAL(12,2),
    "min_Price" DECIMAL(12,2),
    "discount_percent" TEXT,
    "status" "StatusProduct" NOT NULL DEFAULT 'DRAFT',
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "sale_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "product_table" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "country_id" TEXT,
    "category_id" TEXT NOT NULL,
    "brand_id" TEXT,
    "store_id" TEXT NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "price" DECIMAL(12,2),
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "color_id" TEXT,
    "image" TEXT,
    "sale_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "discount_id" TEXT,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_definition" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,

    CONSTRAINT "attribute_definition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variant_attribute_value" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "attribute_id" TEXT NOT NULL,

    CONSTRAINT "variant_attribute_value_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "answer_review" TEXT,
    "answer_id" UUID,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "variant_info" JSONB,
    "user_id" UUID NOT NULL,
    "product_id" TEXT NOT NULL,
    "order_id" TEXT,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_reviews" (
    "id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "verifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "rating" INTEGER NOT NULL,
    "body" TEXT,
    "product_quality" INTEGER,
    "product_name" TEXT,
    "status" "DefaultStatus" NOT NULL DEFAULT 'PENDING',
    "answer_review" TEXT,
    "answer_at" TIMESTAMP(3),
    "response_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "store_id" TEXT NOT NULL,

    CONSTRAINT "store_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coach_reviews" (
    "id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "user_plan_id" TEXT,
    "images" TEXT[],
    "coach_rating" INTEGER NOT NULL,
    "plan_rating" INTEGER NOT NULL,
    "diet_rating" INTEGER NOT NULL,
    "body" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT false,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "status" "DefaultStatus" NOT NULL DEFAULT 'PENDING',
    "answer_review" TEXT,
    "answered_at" TIMESTAMP(3),
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "dislike_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coach_reviews_pkey" PRIMARY KEY ("id")
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

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "shipping_cost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shipping_name" TEXT,
    "store_name" TEXT NOT NULL,
    "commission" DECIMAL(12,2) NOT NULL,
    "commission_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "subtotal" DECIMAL(13,2) NOT NULL,
    "total_price" DECIMAL(13,2) NOT NULL,
    "discount_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "note" TEXT,
    "tracking_code" TEXT,
    "tax_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "checkout_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "shipping_method_id" TEXT,
    "discount_code_id" TEXT,
    "delivered_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "return_deadline" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cart_items" (
    "id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "user_id" UUID NOT NULL,
    "product_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cart_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "original_price" DECIMAL(12,2),
    "total" DECIMAL(13,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "returned_qty" INTEGER DEFAULT 0,
    "attributes" JSONB,
    "color_name" TEXT,
    "color_hex" TEXT,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "variant_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checkouts" (
    "id" TEXT NOT NULL,
    "checkout_number" TEXT NOT NULL,
    "commission_amount" DECIMAL(13,2) NOT NULL DEFAULT 0,
    "sales_profit" DECIMAL(13,2) NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(13,2) NOT NULL,
    "discount_amount" DECIMAL(13,2) NOT NULL DEFAULT 0,
    "tax_amount" DECIMAL(13,2) NOT NULL DEFAULT 0,
    "discount_status" "StatusDiscount",
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" "PaymentMethod",
    "payment_ref" TEXT,
    "shipping_name" TEXT NOT NULL,
    "shipping_phone" TEXT NOT NULL,
    "shipping_city" TEXT NOT NULL,
    "shipping_province" TEXT NOT NULL,
    "shipping_address" TEXT NOT NULL,
    "shipping_postal" TEXT NOT NULL,
    "discount_id" TEXT,
    "user_id" UUID NOT NULL,
    "address_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "gateway_ref" TEXT,
    "authority" TEXT,
    "error_message" TEXT,
    "service_order_id" TEXT,
    "checkout_id" TEXT,
    "plan_request_id" TEXT,
    "subscription_id" TEXT,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_requests" (
    "id" TEXT NOT NULL,
    "request_number" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "reason_detail" TEXT,
    "refund_method" "RefundMethod",
    "refund_amount" DECIMAL(12,2),
    "return_shipping_cost" DECIMAL(12,2),
    "admin_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "return_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "return_items" (
    "id" TEXT NOT NULL,
    "return_request_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "reason" TEXT,
    "condition" TEXT,
    "unit_refund" DECIMAL(12,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "product_id" TEXT,
    "reportsId" TEXT,
    "ticketMessageId" TEXT,
    "returnRequestId" TEXT,
    "coach_id" TEXT,
    "size" INTEGER DEFAULT 0,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "use_case" "MediaUseCase" NOT NULL DEFAULT 'PRODUCT',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "type" "TypeMedia" NOT NULL DEFAULT 'OTHER',
    "is_main" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER DEFAULT 0,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "countries" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "flag" TEXT,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parent_id" TEXT,
    "icon" TEXT,
    "image" TEXT,
    "ancestorIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "meta_title" TEXT,
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "color" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex_code" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "color_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wishlist_items" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" UUID NOT NULL,
    "product_id" TEXT NOT NULL,

    CONSTRAINT "wishlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "user_id" UUID,
    "balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "pending_balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "withdraw_balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "frozen_balance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "is_platform" BOOLEAN NOT NULL DEFAULT false,
    "bank_account_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "status" "WalletTransactionStatus" NOT NULL DEFAULT 'COMPLETED',
    "amount" DECIMAL(18,2) NOT NULL,
    "tracking_code" TEXT NOT NULL,
    "description" TEXT,
    "user_id" UUID NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "order_id" TEXT,
    "service_order_id" TEXT,
    "return_request_id" TEXT,
    "settlement_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL,
    "bank_name" TEXT,
    "account_holder" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "card_number" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,
    "wallet_id" TEXT,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "max_discount" DECIMAL(12,2),
    "value" DECIMAL(12,2) NOT NULL,
    "min_order_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "usage_limit" INTEGER NOT NULL DEFAULT 0,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "per_user_limit" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" "StatusDiscount" NOT NULL DEFAULT 'PRODUCT',
    "type" "DiscountType" NOT NULL DEFAULT 'PERCENTAGE',
    "user_id" UUID,
    "starts_at" TIMESTAMP(3) NOT NULL,
    "ends_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "discount_code_coaches" (
    "discount_code_id" TEXT NOT NULL,
    "coach_id" TEXT NOT NULL,

    CONSTRAINT "discount_code_coaches_pkey" PRIMARY KEY ("discount_code_id","coach_id")
);

-- CreateTable
CREATE TABLE "discount_code_stores" (
    "discountCodeId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,

    CONSTRAINT "discount_code_stores_pkey" PRIMARY KEY ("discountCodeId","storeId")
);

-- CreateTable
CREATE TABLE "discount_code_usages" (
    "id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "discount_code_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "discount_code_usages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provinces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "provinces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "priority" "TicketPriority" NOT NULL,
    "title" TEXT NOT NULL,
    "trackingCode" TEXT NOT NULL,
    "isUserRead" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" UUID NOT NULL,
    "order_id" TEXT,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_messages" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "nameSeller" TEXT,
    "content" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "orderCode" TEXT,
    "trackingCode" TEXT,
    "status" "ReportsStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_free_method" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_shipping_methods" (
    "id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "phrase" TEXT,
    "min_days" INTEGER NOT NULL,
    "max_days" INTEGER NOT NULL,
    "default_price" DECIMAL(12,2),
    "storeId" TEXT NOT NULL,
    "shippingMethodId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_shipping_rates" (
    "id" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "delivery_max_days" INTEGER NOT NULL,
    "storeShippingMethodId" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_shipping_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WorkoutPlanEquipment" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WorkoutPlanEquipment_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EquipmentToExercise" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EquipmentToExercise_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EquipmentToProfile" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EquipmentToProfile_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExerciseToMuscleGroup" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExerciseToMuscleGroup_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CoachToSpecialty" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CoachToSpecialty_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_AttributeDefinitionToCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AttributeDefinitionToCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_referral_code_idx" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_referred_by_id_idx" ON "users"("referred_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "profile_user_id_key" ON "profile"("user_id");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_hash_key" ON "tokens"("token_hash");

-- CreateIndex
CREATE INDEX "tokens_user_id_idx" ON "tokens"("user_id");

-- CreateIndex
CREATE INDEX "otp_codes_target_purpose_idx" ON "otp_codes"("target", "purpose");

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
CREATE UNIQUE INDEX "subscription_plan_slug_key" ON "subscription_plan"("slug");

-- CreateIndex
CREATE INDEX "subscription_plan_is_active_sort_order_idx" ON "subscription_plan"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "subscription_user_id_status_idx" ON "subscription"("user_id", "status");

-- CreateIndex
CREATE INDEX "subscription_status_ends_at_idx" ON "subscription"("status", "ends_at");

-- CreateIndex
CREATE INDEX "subscription_status_trial_ends_at_idx" ON "subscription"("status", "trial_ends_at");

-- CreateIndex
CREATE UNIQUE INDEX "muscle_groups_slug_key" ON "muscle_groups"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "equipments_slug_key" ON "equipments"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_slug_key" ON "exercises"("slug");

-- CreateIndex
CREATE INDEX "exercises_category_id_level_idx" ON "exercises"("category_id", "level");

-- CreateIndex
CREATE UNIQUE INDEX "foods_name_key" ON "foods"("name");

-- CreateIndex
CREATE INDEX "foods_name_idx" ON "foods"("name");

-- CreateIndex
CREATE UNIQUE INDEX "specialties_slug_key" ON "specialties"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "coaches_user_id_key" ON "coaches"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "coaches_title_key" ON "coaches"("title");

-- CreateIndex
CREATE UNIQUE INDEX "coaches_slug_key" ON "coaches"("slug");

-- CreateIndex
CREATE INDEX "coaches_status_is_accepting_clients_idx" ON "coaches"("status", "is_accepting_clients");

-- CreateIndex
CREATE INDEX "coaches_status_province_id_city_id_idx" ON "coaches"("status", "province_id", "city_id");

-- CreateIndex
CREATE INDEX "coaches_title_headline_idx" ON "coaches"("title", "headline");

-- CreateIndex
CREATE INDEX "coaches_status_idx" ON "coaches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "coach_ratings_coach_id_key" ON "coach_ratings"("coach_id");

-- CreateIndex
CREATE INDEX "coach_ratings_avg_coach_rating_idx" ON "coach_ratings"("avg_coach_rating");

-- CreateIndex
CREATE INDEX "coach_ratings_avg_plan_rating_idx" ON "coach_ratings"("avg_plan_rating");

-- CreateIndex
CREATE INDEX "coach_ratings_total_reviews_idx" ON "coach_ratings"("total_reviews");

-- CreateIndex
CREATE INDEX "coach_achievements_coach_id_idx" ON "coach_achievements"("coach_id");

-- CreateIndex
CREATE INDEX "coach_achievements_coach_id_is_verified_idx" ON "coach_achievements"("coach_id", "is_verified");

-- CreateIndex
CREATE INDEX "coach_achievements_year_idx" ON "coach_achievements"("year");

-- CreateIndex
CREATE INDEX "certifications_coach_id_idx" ON "certifications"("coach_id");

-- CreateIndex
CREATE INDEX "certifications_coach_id_type_idx" ON "certifications"("coach_id", "type");

-- CreateIndex
CREATE INDEX "coach_availabilities_coach_id_weekday_idx" ON "coach_availabilities"("coach_id", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "coach_availabilities_coach_id_weekday_key" ON "coach_availabilities"("coach_id", "weekday");

-- CreateIndex
CREATE INDEX "user_logs_user_id_jalali_year_jalali_month_idx" ON "user_logs"("user_id", "jalali_year", "jalali_month");

-- CreateIndex
CREATE INDEX "user_logs_user_plan_id_idx" ON "user_logs"("user_plan_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_logs_user_id_date_key" ON "user_logs"("user_id", "date");

-- CreateIndex
CREATE INDEX "user_plans_user_id_status_idx" ON "user_plans"("user_id", "status");

-- CreateIndex
CREATE INDEX "user_plans_request_id_idx" ON "user_plans"("request_id");

-- CreateIndex
CREATE INDEX "user_plans_coach_id_status_created_at_idx" ON "user_plans"("coach_id", "status", "created_at");

-- CreateIndex
CREATE INDEX "user_plans_user_id_created_at_idx" ON "user_plans"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "plan_requests_coach_id_status_idx" ON "plan_requests"("coach_id", "status");

-- CreateIndex
CREATE INDEX "plan_requests_user_id_status_idx" ON "plan_requests"("user_id", "status");

-- CreateIndex
CREATE INDEX "workout_plans_coach_id_idx" ON "workout_plans"("coach_id");

-- CreateIndex
CREATE INDEX "workout_plans_avg_rating_idx" ON "workout_plans"("avg_rating");

-- CreateIndex
CREATE INDEX "workout_plans_is_published_avg_rating_idx" ON "workout_plans"("is_published", "avg_rating");

-- CreateIndex
CREATE INDEX "workout_plans_training_goal_id_idx" ON "workout_plans"("training_goal_id");

-- CreateIndex
CREATE INDEX "workout_plans_source_is_published_idx" ON "workout_plans"("source", "is_published");

-- CreateIndex
CREATE INDEX "workout_phases_plan_id_order_idx" ON "workout_phases"("plan_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "workout_phases_plan_id_start_week_key" ON "workout_phases"("plan_id", "start_week");

-- CreateIndex
CREATE INDEX "workout_days_plan_id_idx" ON "workout_days"("plan_id");

-- CreateIndex
CREATE INDEX "workout_days_workout_phase_id_idx" ON "workout_days"("workout_phase_id");

-- CreateIndex
CREATE UNIQUE INDEX "workout_days_workout_phase_id_day_index_key" ON "workout_days"("workout_phase_id", "day_index");

-- CreateIndex
CREATE INDEX "workout_day_exercises_day_id_idx" ON "workout_day_exercises"("day_id");

-- CreateIndex
CREATE INDEX "workout_day_exercises_exercise_id_idx" ON "workout_day_exercises"("exercise_id");

-- CreateIndex
CREATE UNIQUE INDEX "workout_day_exercises_day_id_order_key" ON "workout_day_exercises"("day_id", "order");

-- CreateIndex
CREATE INDEX "diet_plans_coach_id_idx" ON "diet_plans"("coach_id");

-- CreateIndex
CREATE INDEX "diet_plans_is_published_idx" ON "diet_plans"("is_published");

-- CreateIndex
CREATE INDEX "diet_plans_is_published_avg_rating_idx" ON "diet_plans"("is_published", "avg_rating");

-- CreateIndex
CREATE INDEX "diet_plans_source_is_published_idx" ON "diet_plans"("source", "is_published");

-- CreateIndex
CREATE INDEX "diet_phases_plan_id_order_idx" ON "diet_phases"("plan_id", "order");

-- CreateIndex
CREATE UNIQUE INDEX "diet_phases_plan_id_start_week_key" ON "diet_phases"("plan_id", "start_week");

-- CreateIndex
CREATE INDEX "diet_days_plan_id_idx" ON "diet_days"("plan_id");

-- CreateIndex
CREATE INDEX "diet_days_diet_phase_id_idx" ON "diet_days"("diet_phase_id");

-- CreateIndex
CREATE UNIQUE INDEX "diet_days_diet_phase_id_weekday_key" ON "diet_days"("diet_phase_id", "weekday");

-- CreateIndex
CREATE INDEX "diet_meals_day_id_order_idx" ON "diet_meals"("day_id", "order");

-- CreateIndex
CREATE INDEX "diet_meal_items_meal_id_idx" ON "diet_meal_items"("meal_id");

-- CreateIndex
CREATE INDEX "diet_meal_items_food_id_idx" ON "diet_meal_items"("food_id");

-- CreateIndex
CREATE UNIQUE INDEX "stores_owner_id_key" ON "stores"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_is_active_is_verified_idx" ON "stores"("is_active", "is_verified");

-- CreateIndex
CREATE INDEX "stores_is_active_is_verified_name_idx" ON "stores"("is_active", "is_verified", "name");

-- CreateIndex
CREATE UNIQUE INDEX "store_ratings_seller_id_key" ON "store_ratings"("seller_id");

-- CreateIndex
CREATE INDEX "store_ratings_avg_rating_idx" ON "store_ratings"("avg_rating");

-- CreateIndex
CREATE INDEX "store_ratings_total_reviews_idx" ON "store_ratings"("total_reviews");

-- CreateIndex
CREATE INDEX "store_ratings_product_quality_idx" ON "store_ratings"("product_quality");

-- CreateIndex
CREATE INDEX "store_ratings_answered_responses_idx" ON "store_ratings"("answered_responses");

-- CreateIndex
CREATE INDEX "store_ratings_response_rate_idx" ON "store_ratings"("response_rate");

-- CreateIndex
CREATE INDEX "store_ratings_response_time_idx" ON "store_ratings"("response_time");

-- CreateIndex
CREATE INDEX "store_ratings_sale_count_idx" ON "store_ratings"("sale_count");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_store_id_idx" ON "products"("store_id");

-- CreateIndex
CREATE INDEX "products_category_id_idx" ON "products"("category_id");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE INDEX "products_is_featured_idx" ON "products"("is_featured");

-- CreateIndex
CREATE INDEX "products_min_Price_idx" ON "products"("min_Price");

-- CreateIndex
CREATE INDEX "products_sale_count_idx" ON "products"("sale_count");

-- CreateIndex
CREATE INDEX "products_rating_idx" ON "products"("rating");

-- CreateIndex
CREATE INDEX "products_updated_at_idx" ON "products"("updated_at");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_product_id_idx" ON "product_variants"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_definition_key_key" ON "attribute_definition"("key");

-- CreateIndex
CREATE INDEX "variant_attribute_value_attribute_id_value_idx" ON "variant_attribute_value"("attribute_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "variant_attribute_value_variant_id_attribute_id_key" ON "variant_attribute_value"("variant_id", "attribute_id");

-- CreateIndex
CREATE INDEX "reviews_product_id_idx" ON "reviews"("product_id");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_is_approved_idx" ON "reviews"("is_approved");

-- CreateIndex
CREATE INDEX "reviews_answer_id_idx" ON "reviews"("answer_id");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_user_id_product_id_key" ON "reviews"("user_id", "product_id");

-- CreateIndex
CREATE INDEX "store_reviews_store_id_idx" ON "store_reviews"("store_id");

-- CreateIndex
CREATE INDEX "store_reviews_user_id_idx" ON "store_reviews"("user_id");

-- CreateIndex
CREATE INDEX "store_reviews_status_idx" ON "store_reviews"("status");

-- CreateIndex
CREATE UNIQUE INDEX "store_reviews_user_id_store_id_key" ON "store_reviews"("user_id", "store_id");

-- CreateIndex
CREATE INDEX "coach_reviews_coach_id_status_idx" ON "coach_reviews"("coach_id", "status");

-- CreateIndex
CREATE INDEX "coach_reviews_author_id_idx" ON "coach_reviews"("author_id");

-- CreateIndex
CREATE INDEX "coach_reviews_created_at_idx" ON "coach_reviews"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "coach_reviews_coach_id_author_id_key" ON "coach_reviews"("coach_id", "author_id");

-- CreateIndex
CREATE INDEX "reactions_review_id_type_idx" ON "reactions"("review_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_user_id_review_id_key" ON "reactions"("user_id", "review_id");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_user_id_idx" ON "orders"("user_id");

-- CreateIndex
CREATE INDEX "orders_store_id_idx" ON "orders"("store_id");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_checkout_id_idx" ON "orders"("checkout_id");

-- CreateIndex
CREATE INDEX "cart_items_user_id_idx" ON "cart_items"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "cart_items_user_id_variant_id_key" ON "cart_items"("user_id", "variant_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_store_id_idx" ON "order_items"("store_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkouts_checkout_number_key" ON "checkouts"("checkout_number");

-- CreateIndex
CREATE INDEX "checkouts_user_id_idx" ON "checkouts"("user_id");

-- CreateIndex
CREATE INDEX "checkouts_payment_status_status_created_at_idx" ON "checkouts"("payment_status", "status", "created_at");

-- CreateIndex
CREATE INDEX "payments_service_order_id_idx" ON "payments"("service_order_id");

-- CreateIndex
CREATE INDEX "payments_plan_request_id_idx" ON "payments"("plan_request_id");

-- CreateIndex
CREATE INDEX "payments_subscription_id_idx" ON "payments"("subscription_id");

-- CreateIndex
CREATE INDEX "payments_checkout_id_idx" ON "payments"("checkout_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_method_gateway_ref_key" ON "payments"("method", "gateway_ref");

-- CreateIndex
CREATE UNIQUE INDEX "return_requests_request_number_key" ON "return_requests"("request_number");

-- CreateIndex
CREATE INDEX "return_requests_order_id_idx" ON "return_requests"("order_id");

-- CreateIndex
CREATE INDEX "return_requests_user_id_idx" ON "return_requests"("user_id");

-- CreateIndex
CREATE INDEX "return_requests_status_idx" ON "return_requests"("status");

-- CreateIndex
CREATE INDEX "return_requests_created_at_idx" ON "return_requests"("created_at");

-- CreateIndex
CREATE INDEX "return_items_return_request_id_idx" ON "return_items"("return_request_id");

-- CreateIndex
CREATE INDEX "return_items_order_item_id_idx" ON "return_items"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "media_url_key" ON "media"("url");

-- CreateIndex
CREATE INDEX "media_product_id_idx" ON "media"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "brands_slug_key" ON "brands"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "countries_slug_key" ON "countries"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- CreateIndex
CREATE INDEX "categories_is_active_sort_order_idx" ON "categories"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "color_slug_key" ON "color"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wishlist_items_user_id_product_id_key" ON "wishlist_items"("user_id", "product_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallets_is_platform_idx" ON "wallets"("is_platform");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_tracking_code_key" ON "wallet_transactions"("tracking_code");

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_idx" ON "wallet_transactions"("user_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_wallet_id_idx" ON "wallet_transactions"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_status_idx" ON "wallet_transactions"("type", "status");

-- CreateIndex
CREATE INDEX "wallet_transactions_order_id_idx" ON "wallet_transactions"("order_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_user_id_created_at_idx" ON "wallet_transactions"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "wallet_transactions_type_status_settlement_date_idx" ON "wallet_transactions"("type", "status", "settlement_date");

-- CreateIndex
CREATE INDEX "wallet_transactions_service_order_id_idx" ON "wallet_transactions"("service_order_id");

-- CreateIndex
CREATE INDEX "bank_accounts_user_id_idx" ON "bank_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "discount_codes_code_key" ON "discount_codes"("code");

-- CreateIndex
CREATE INDEX "discount_codes_user_id_idx" ON "discount_codes"("user_id");

-- CreateIndex
CREATE INDEX "discount_code_stores_storeId_idx" ON "discount_code_stores"("storeId");

-- CreateIndex
CREATE INDEX "discount_code_usages_discount_code_id_idx" ON "discount_code_usages"("discount_code_id");

-- CreateIndex
CREATE INDEX "discount_code_usages_user_id_idx" ON "discount_code_usages"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "provinces_name_key" ON "provinces"("name");

-- CreateIndex
CREATE INDEX "cities_provinceId_idx" ON "cities"("provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "cities_provinceId_name_key" ON "cities"("provinceId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_order_id_key" ON "tickets"("order_id");

-- CreateIndex
CREATE INDEX "tickets_user_id_idx" ON "tickets"("user_id");

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_priority_idx" ON "tickets"("priority");

-- CreateIndex
CREATE INDEX "ticket_messages_ticketId_idx" ON "ticket_messages"("ticketId");

-- CreateIndex
CREATE INDEX "ticket_messages_senderId_idx" ON "ticket_messages"("senderId");

-- CreateIndex
CREATE INDEX "ticket_messages_createdAt_idx" ON "ticket_messages"("createdAt");

-- CreateIndex
CREATE INDEX "reports_status_idx" ON "reports"("status");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_methods_name_key" ON "shipping_methods"("name");

-- CreateIndex
CREATE INDEX "shipping_methods_is_active_idx" ON "shipping_methods"("is_active");

-- CreateIndex
CREATE INDEX "store_shipping_methods_storeId_idx" ON "store_shipping_methods"("storeId");

-- CreateIndex
CREATE INDEX "store_shipping_methods_shippingMethodId_idx" ON "store_shipping_methods"("shippingMethodId");

-- CreateIndex
CREATE UNIQUE INDEX "store_shipping_methods_storeId_shippingMethodId_key" ON "store_shipping_methods"("storeId", "shippingMethodId");

-- CreateIndex
CREATE INDEX "store_shipping_rates_provinceId_idx" ON "store_shipping_rates"("provinceId");

-- CreateIndex
CREATE UNIQUE INDEX "store_shipping_rates_storeShippingMethodId_provinceId_key" ON "store_shipping_rates"("storeShippingMethodId", "provinceId");

-- CreateIndex
CREATE INDEX "_WorkoutPlanEquipment_B_index" ON "_WorkoutPlanEquipment"("B");

-- CreateIndex
CREATE INDEX "_EquipmentToExercise_B_index" ON "_EquipmentToExercise"("B");

-- CreateIndex
CREATE INDEX "_EquipmentToProfile_B_index" ON "_EquipmentToProfile"("B");

-- CreateIndex
CREATE INDEX "_ExerciseToMuscleGroup_B_index" ON "_ExerciseToMuscleGroup"("B");

-- CreateIndex
CREATE INDEX "_CoachToSpecialty_B_index" ON "_CoachToSpecialty"("B");

-- CreateIndex
CREATE INDEX "_AttributeDefinitionToCategory_B_index" ON "_AttributeDefinitionToCategory"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_referred_by_id_fkey" FOREIGN KEY ("referred_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profile" ADD CONSTRAINT "profile_training_goal_id_fkey" FOREIGN KEY ("training_goal_id") REFERENCES "training_goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_plan_request_id_fkey" FOREIGN KEY ("plan_request_id") REFERENCES "plan_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "subscription_plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coaches" ADD CONSTRAINT "coaches_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_ratings" ADD CONSTRAINT "coach_ratings_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_achievements" ADD CONSTRAINT "coach_achievements_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "certifications" ADD CONSTRAINT "certifications_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_availabilities" ADD CONSTRAINT "coach_availabilities_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_logs" ADD CONSTRAINT "user_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_logs" ADD CONSTRAINT "user_logs_user_plan_id_fkey" FOREIGN KEY ("user_plan_id") REFERENCES "user_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_workout_plan_id_fkey" FOREIGN KEY ("workout_plan_id") REFERENCES "workout_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_diet_plan_id_fkey" FOREIGN KEY ("diet_plan_id") REFERENCES "diet_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "plan_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_plans" ADD CONSTRAINT "user_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_requests" ADD CONSTRAINT "plan_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_requests" ADD CONSTRAINT "plan_requests_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_requests" ADD CONSTRAINT "plan_requests_workout_template_id_fkey" FOREIGN KEY ("workout_template_id") REFERENCES "workout_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plan_requests" ADD CONSTRAINT "plan_requests_diet_template_id_fkey" FOREIGN KEY ("diet_template_id") REFERENCES "diet_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_training_goal_id_fkey" FOREIGN KEY ("training_goal_id") REFERENCES "training_goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_plans" ADD CONSTRAINT "workout_plans_diet_plan_id_fkey" FOREIGN KEY ("diet_plan_id") REFERENCES "diet_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_phases" ADD CONSTRAINT "workout_phases_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_days" ADD CONSTRAINT "workout_days_workout_phase_id_fkey" FOREIGN KEY ("workout_phase_id") REFERENCES "workout_phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_day_exercises" ADD CONSTRAINT "workout_day_exercises_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "workout_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workout_day_exercises" ADD CONSTRAINT "workout_day_exercises_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_plans" ADD CONSTRAINT "diet_plans_training_goal_id_fkey" FOREIGN KEY ("training_goal_id") REFERENCES "training_goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_phases" ADD CONSTRAINT "diet_phases_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "diet_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_days" ADD CONSTRAINT "diet_days_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "diet_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_days" ADD CONSTRAINT "diet_days_diet_phase_id_fkey" FOREIGN KEY ("diet_phase_id") REFERENCES "diet_phases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_meals" ADD CONSTRAINT "diet_meals_day_id_fkey" FOREIGN KEY ("day_id") REFERENCES "diet_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_meal_items" ADD CONSTRAINT "diet_meal_items_meal_id_fkey" FOREIGN KEY ("meal_id") REFERENCES "diet_meals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "diet_meal_items" ADD CONSTRAINT "diet_meal_items_food_id_fkey" FOREIGN KEY ("food_id") REFERENCES "foods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_province_id_fkey" FOREIGN KEY ("province_id") REFERENCES "provinces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "cities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_ratings" ADD CONSTRAINT "store_ratings_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_brand_id_fkey" FOREIGN KEY ("brand_id") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_country_id_fkey" FOREIGN KEY ("country_id") REFERENCES "countries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_color_id_fkey" FOREIGN KEY ("color_id") REFERENCES "color"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attribute_value" ADD CONSTRAINT "variant_attribute_value_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variant_attribute_value" ADD CONSTRAINT "variant_attribute_value_attribute_id_fkey" FOREIGN KEY ("attribute_id") REFERENCES "attribute_definition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_answer_id_fkey" FOREIGN KEY ("answer_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_reviews" ADD CONSTRAINT "store_reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_reviews" ADD CONSTRAINT "store_reviews_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_reviews" ADD CONSTRAINT "coach_reviews_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_reviews" ADD CONSTRAINT "coach_reviews_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coach_reviews" ADD CONSTRAINT "coach_reviews_user_plan_id_fkey" FOREIGN KEY ("user_plan_id") REFERENCES "user_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "coach_reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_checkout_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_method_id_fkey" FOREIGN KEY ("shipping_method_id") REFERENCES "store_shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_address_id_fkey" FOREIGN KEY ("address_id") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_discount_id_fkey" FOREIGN KEY ("discount_id") REFERENCES "discount_codes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_checkout_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_plan_request_id_fkey" FOREIGN KEY ("plan_request_id") REFERENCES "plan_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_requests" ADD CONSTRAINT "return_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_return_request_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "return_items" ADD CONSTRAINT "return_items_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_reportsId_fkey" FOREIGN KEY ("reportsId") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_ticketMessageId_fkey" FOREIGN KEY ("ticketMessageId") REFERENCES "ticket_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "media" ADD CONSTRAINT "media_returnRequestId_fkey" FOREIGN KEY ("returnRequestId") REFERENCES "return_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wishlist_items" ADD CONSTRAINT "wishlist_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_return_request_id_fkey" FOREIGN KEY ("return_request_id") REFERENCES "return_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_service_order_id_fkey" FOREIGN KEY ("service_order_id") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_codes" ADD CONSTRAINT "discount_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_coaches" ADD CONSTRAINT "discount_code_coaches_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_coaches" ADD CONSTRAINT "discount_code_coaches_coach_id_fkey" FOREIGN KEY ("coach_id") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_stores" ADD CONSTRAINT "discount_code_stores_discountCodeId_fkey" FOREIGN KEY ("discountCodeId") REFERENCES "discount_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_stores" ADD CONSTRAINT "discount_code_stores_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "discount_code_usages" ADD CONSTRAINT "discount_code_usages_discount_code_id_fkey" FOREIGN KEY ("discount_code_id") REFERENCES "discount_codes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cities" ADD CONSTRAINT "cities_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_messages" ADD CONSTRAINT "ticket_messages_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_shipping_methods" ADD CONSTRAINT "store_shipping_methods_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_shipping_methods" ADD CONSTRAINT "store_shipping_methods_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_shipping_rates" ADD CONSTRAINT "store_shipping_rates_storeShippingMethodId_fkey" FOREIGN KEY ("storeShippingMethodId") REFERENCES "store_shipping_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_shipping_rates" ADD CONSTRAINT "store_shipping_rates_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkoutPlanEquipment" ADD CONSTRAINT "_WorkoutPlanEquipment_A_fkey" FOREIGN KEY ("A") REFERENCES "equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkoutPlanEquipment" ADD CONSTRAINT "_WorkoutPlanEquipment_B_fkey" FOREIGN KEY ("B") REFERENCES "workout_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentToExercise" ADD CONSTRAINT "_EquipmentToExercise_A_fkey" FOREIGN KEY ("A") REFERENCES "equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentToExercise" ADD CONSTRAINT "_EquipmentToExercise_B_fkey" FOREIGN KEY ("B") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentToProfile" ADD CONSTRAINT "_EquipmentToProfile_A_fkey" FOREIGN KEY ("A") REFERENCES "equipments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EquipmentToProfile" ADD CONSTRAINT "_EquipmentToProfile_B_fkey" FOREIGN KEY ("B") REFERENCES "profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" ADD CONSTRAINT "_ExerciseToMuscleGroup_A_fkey" FOREIGN KEY ("A") REFERENCES "exercises"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExerciseToMuscleGroup" ADD CONSTRAINT "_ExerciseToMuscleGroup_B_fkey" FOREIGN KEY ("B") REFERENCES "muscle_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoachToSpecialty" ADD CONSTRAINT "_CoachToSpecialty_A_fkey" FOREIGN KEY ("A") REFERENCES "coaches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CoachToSpecialty" ADD CONSTRAINT "_CoachToSpecialty_B_fkey" FOREIGN KEY ("B") REFERENCES "specialties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttributeDefinitionToCategory" ADD CONSTRAINT "_AttributeDefinitionToCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "attribute_definition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AttributeDefinitionToCategory" ADD CONSTRAINT "_AttributeDefinitionToCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
