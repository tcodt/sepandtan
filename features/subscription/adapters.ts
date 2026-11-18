import type { SubscriptionPlan } from "@/lib/types/plan";
import type { SubscriptionPlanDto } from "./types";

function periodLabelFromDays(days: number): string {
  if (days <= 0) return "";
  if (days === 30) return "/ماه";
  if (days === 45) return "۴۵ روزه";
  if (days === 90) return "۹۰ روزه";
  return `${days} روزه`;
}

/** Backend DTO → UI SubscriptionPlan (lib/types/plan) */
export function toUiSubscriptionPlan(
  dto: SubscriptionPlanDto,
): SubscriptionPlan {
  return {
    id: dto.id,
    name: dto.title,
    price: dto.price,
    periodLabel: periodLabelFromDays(dto.durationDays),
    featured: dto.isPopular,
    badge: dto.isPopular ? "محبوب‌ترین" : null,
    ctaLabel: `انتخاب ${dto.title}`,
    sortOrder: dto.sortOrder,
    isActive: dto.isActive,
    features: [...dto.features],
    durationDays: dto.durationDays,
    isPopular: dto.isPopular,
    description: dto.description ?? undefined,
    createdAt: dto.createdAt,
  };
}
