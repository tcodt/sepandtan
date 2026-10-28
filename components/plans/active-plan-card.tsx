"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store/user-store";
import { getSubscriptionPlanById } from "@/lib/api/subscription-plans";
import {
  getSubscriptionLabel,
  isPaidSubscription,
} from "@/lib/subscription/access";
import type { SubscriptionPlan } from "@/lib/types/plan";
import type { SubscriptionStatus } from "@/lib/types/plan";

/**
 * مپ وضعیت اشتراک → id پلن اشتراک در Fake API
 * (جدا از currentPlanId که مربوط به برنامه تمرینی است)
 */
const STATUS_TO_SUBSCRIPTION_PLAN_ID: Partial<
  Record<SubscriptionStatus, string>
> = {
  free: undefined,
  basic: "sub_basic",
  pro: "sub_pro",
  premium: "sub_premium",
  coach_plan: undefined,
  ai_plan: undefined,
  vip: "sub_premium",
};

export function ActivePlanCard() {
  const user = useUserStore((s) => s.user);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  const status = user?.subscriptionStatus ?? "free";
  const subscriptionPlanId = STATUS_TO_SUBSCRIPTION_PLAN_ID[status];

  useEffect(() => {
    if (!subscriptionPlanId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlan(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getSubscriptionPlanById(subscriptionPlanId)
      .then((data) => {
        if (!cancelled) setPlan(data);
      })
      .catch(() => {
        if (!cancelled) setPlan(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [subscriptionPlanId]);

  const statusLabel = getSubscriptionLabel(status);
  const isPaid = isPaidSubscription(user);

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-base">اشتراک فعلی</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">وضعیت</span>
              <span className="font-medium text-foreground">{statusLabel}</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">پلن</span>
              <span className="font-medium text-foreground text-left">
                {plan?.name || "پلن رایگان"}
              </span>
            </div>

            {plan && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">قیمت</span>
                <span className="font-medium text-primary">
                  {plan.price.toLocaleString("fa-IR")} تومان
                </span>
              </div>
            )}

            {user?.subscriptionExpiresAt && isPaid && (
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="text-muted-foreground">انقضا</span>
                <span className="font-medium text-foreground">
                  {new Date(user.subscriptionExpiresAt).toLocaleDateString(
                    "fa-IR",
                  )}
                </span>
              </div>
            )}

            <Button asChild variant="outline" size="sm" className="w-full mt-1">
              <Link href={plan ? `/checkout?plan=${plan.id}` : "/#plans"}>
                {isPaid || plan ? "مدیریت / تغییر پلن" : "ارتقای اشتراک"}
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
