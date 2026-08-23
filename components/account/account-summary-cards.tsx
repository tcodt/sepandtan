"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Target, Scale, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store/user-store";
import { getSubscriptionPlanById } from "@/lib/api/subscription-plans";
import type { SubscriptionPlan } from "@/lib/types/plan";

const goalLabels: Record<string, string> = {
  lose_weight: "کاهش وزن",
  build_muscle: "عضله‌سازی",
  maintain: "حفظ تناسب",
  endurance: "استقامت",
  general_fitness: "آمادگی عمومی",
};

export function AccountSummaryCards() {
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
      ? "فعال"
      : user?.subscriptionStatus === "vip"
        ? "VIP"
        : user?.subscriptionStatus === "coach_plan"
          ? "پلن مربی"
          : "رایگان";

  const cards = [
    {
      icon: Crown,
      label: "اشتراک",
      value: statusLabel,
      sub: plan?.name || "پلن رایگان",
    },
    {
      icon: Target,
      label: "هدف",
      value: user?.goal ? goalLabels[user.goal] : "تعیین‌نشده",
      sub: user?.onboardingCompleted ? "برنامه فعال" : "نیاز به آنبوردینگ",
    },
    {
      icon: Scale,
      label: "وزن فعلی",
      value:
        user?.bodyInfo?.weight != null
          ? `${user.bodyInfo.weight.toLocaleString("fa-IR")} کیلو`
          : "—",
      sub:
        user?.targetWeight != null
          ? `هدف ${user.targetWeight.toLocaleString("fa-IR")} کیلو`
          : "هدف ثبت نشده",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
            >
              <Card className="border-border bg-card/80 backdrop-blur-sm h-full">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-xs">{card.label}</span>
                  </div>
                  <p className="text-base font-semibold text-foreground">
                    {card.value}
                  </p>
                  <p className="text-xs text-muted-foreground">{card.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {plan ? "پلن تو فعال است" : "هنوز پلن ویژه نداری"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {plan
                ? "می‌توانی پلن را مدیریت یا تغییر بدهی."
                : "با ارتقا، امکانات کامل‌تری آزاد می‌شود."}
            </p>
          </div>
        </div>

        <Button asChild variant={plan ? "outline" : "default"}>
          <Link href="/#plans">{plan ? "تغییر پلن" : "مشاهده پلن‌ها"}</Link>
        </Button>
      </motion.div>
    </div>
  );
}
