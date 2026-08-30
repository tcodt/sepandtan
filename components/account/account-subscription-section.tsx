"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUserStore } from "@/lib/store/user-store";
import { getSubscriptionPlanById } from "@/lib/api/subscription-plans";
import type { SubscriptionPlan } from "@/lib/types/plan";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Crown, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const statusColor =
    user?.subscriptionStatus === "vip"
      ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
      : user?.subscriptionStatus === "ai_plan"
        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
        : user?.subscriptionStatus === "coach_plan"
          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
          : "bg-muted text-muted-foreground border-border";

  const isActive =
    user?.subscriptionStatus && user.subscriptionStatus !== "free";

  return (
    <Card className="border-border/50 bg-linear-to-br from-primary/5 via-muted/30 to-transparent backdrop-blur-sm">
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            اشتراک من
          </h3>
          <span
            className={cn(
              "text-xs font-medium px-3 py-1 rounded-full border",
              statusColor,
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-muted/30">
            <span className="text-muted-foreground">پلن</span>
            <span className="font-medium text-foreground">
              {plan?.name || "پلن رایگان"}
            </span>
          </div>

          {plan && (
            <>
              <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-muted/30">
                <span className="text-muted-foreground">مبلغ</span>
                <span className="font-medium text-primary">
                  {plan.price.toLocaleString("fa-IR")} تومان {plan.periodLabel}
                </span>
              </div>
              {plan.features && plan.features.length > 0 && (
                <div className="sm:col-span-2 p-3 rounded-xl bg-muted/30">
                  <p className="text-xs text-muted-foreground mb-2">
                    امکانات پلن:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {plan.features.slice(0, 3).map((feature, index) => (
                      <span
                        key={index}
                        className="text-xs flex items-center gap-1 text-muted-foreground"
                      >
                        <CheckCircle2 className="w-3 h-3 text-primary" />
                        {feature}
                      </span>
                    ))}
                    {plan.features.length > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{plan.features.length - 3} مورد دیگر
                      </span>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <Button
          asChild
          variant={isActive ? "outline" : "default"}
          className={cn("w-full", !isActive && "shadow-lg shadow-primary/20")}
        >
          <Link href="/#plans">{isActive ? "تغییر پلن" : "مشاهده پلن‌ها"}</Link>
        </Button>

        {isActive && (
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground">
            اشتراک شما فعال است. برای مدیریت یا لغو به صفحه پلن‌ها مراجعه کنید.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
