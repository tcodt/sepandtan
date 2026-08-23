"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/lib/store/user-store";
import { getSubscriptionPlanById } from "@/lib/api/subscription-plans";
import type { SubscriptionPlan } from "@/lib/types/plan";
import { Button } from "@/components/ui/button";

export function AccountSubscriptionSection() {
  const user = useUserStore((s) => s.user);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);

  useEffect(() => {
    if (!user?.selectedPlanId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlan(null);
      return;
    }
    getSubscriptionPlanById(user.selectedPlanId)
      .then(setPlan)
      .catch(() => setPlan(null));
  }, [user?.selectedPlanId]);

  const statusLabel =
    user?.subscriptionStatus === "ai_plan"
      ? "فعال (AI)"
      : user?.subscriptionStatus === "vip"
        ? "VIP"
        : user?.subscriptionStatus === "coach_plan"
          ? "پلن مربی"
          : "رایگان";

  return (
    <section className="rounded-2xl border border-border bg-card/80 p-4 space-y-3">
      <h3 className="text-base font-semibold text-foreground">اشتراک من</h3>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">وضعیت</span>
        <span className="font-medium">{statusLabel}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">پلن</span>
        <span className="font-medium text-left">
          {plan?.name || "پلن رایگان"}
        </span>
      </div>

      {plan && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">مبلغ</span>
          <span className="font-medium text-primary">
            {plan.price.toLocaleString("fa-IR")} تومان {plan.periodLabel}
          </span>
        </div>
      )}

      <Button asChild variant="outline" className="w-full">
        <Link href="/#plans">{plan ? "تغییر پلن" : "مشاهده پلن‌ها"}</Link>
      </Button>
    </section>
  );
}
