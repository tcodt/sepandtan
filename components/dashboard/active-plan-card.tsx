"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store/user-store";
import { getSubscriptionPlanById } from "@/lib/api/subscription-plans";
import type { SubscriptionPlan } from "@/lib/types/plan";

export function ActivePlanCard() {
  const user = useUserStore((s) => s.user);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user?.selectedPlanId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlan(null);
      return;
    }

    setLoading(true);
    getSubscriptionPlanById(user.selectedPlanId)
      .then((data) => setPlan(data))
      .catch(() => setPlan(null))
      .finally(() => setLoading(false));
  }, [user?.selectedPlanId]);

  const statusLabel =
    user?.subscriptionStatus === "ai_plan"
      ? "فعال"
      : user?.subscriptionStatus === "vip"
        ? "VIP"
        : user?.subscriptionStatus === "coach_plan"
          ? "پلن مربی"
          : "رایگان";

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

            <Button asChild variant="outline" size="sm" className="w-full mt-1">
              <Link href={plan ? "/checkout?plan=" + plan.id : "/#plans"}>
                {plan ? "مدیریت / تغییر پلن" : "ارتقای اشتراک"}
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
