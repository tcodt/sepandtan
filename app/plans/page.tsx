"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Sparkles,
  Calendar,
  Layers,
  LayoutGrid,
} from "lucide-react";
import { PlansScreen } from "@/components/plans/plans-screen";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useUserStore } from "@/lib/store/user-store";
import { getPlansByUser } from "@/lib/api/plans";
import { getSubscriptionLabel } from "@/lib/subscription/access";
import type { Plan } from "@/lib/types/plan";

export default function PlansPage() {
  const { isLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: true,
  });

  const user = useUserStore((s) => s.user);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPlans([]);
      setPlansLoading(false);
      return;
    }

    let cancelled = false;
    setPlansLoading(true);

    getPlansByUser(user.id)
      .then((list) => {
        if (!cancelled) setPlans(list);
      })
      .catch(() => {
        if (!cancelled) setPlans([]);
      })
      .finally(() => {
        if (!cancelled) setPlansLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const stats = useMemo(() => {
    const activeCount = plans.filter(
      (p) => p.id === user?.currentPlanId || p.status === "active",
    ).length;
    // اگر currentPlanId با status هم‌خوان باشد معمولاً 0 یا 1 است
    const normalizedActive = user?.currentPlanId
      ? plans.some((p) => p.id === user.currentPlanId)
        ? 1
        : activeCount > 0
          ? 1
          : 0
      : 0;
    const total = plans.length;
    const archivedCount = Math.max(total - normalizedActive, 0);
    const planLabel = getSubscriptionLabel(user?.subscriptionStatus);

    return {
      activeCount: normalizedActive,
      archivedCount,
      total,
      planLabel,
    };
  }, [plans, user?.currentPlanId, user?.subscriptionStatus]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-b from-background to-muted/30">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
        <p className="mt-4 text-sm text-muted-foreground animate-pulse">
          در حال بارگذاری...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <div className="absolute top-0 left-0 right-0 h-64 bg-linear-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute top-32 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-6 lg:space-y-8">
        <header className="flex items-start gap-3 lg:gap-4">
          <Link
            href="/dashboard"
            className="mt-0.5 p-2.5 -mr-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all duration-200 hover:scale-105 lg:p-3"
            aria-label="بازگشت"
          >
            <ChevronRight className="w-5 h-5 lg:w-6 lg:h-6" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-1">
              <div className="p-1.5 lg:p-2 rounded-lg bg-primary/10">
                <Layers className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
                برنامه‌های من
              </h1>
              <span className="hidden md:inline-flex items-center gap-1.5 text-xs lg:text-sm bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                مدیریت برنامه‌ها
              </span>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground">
              فقط یک برنامه می‌تونه همزمان فعال باشه
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 lg:p-4 text-center hover:border-primary/20 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-center gap-1.5 text-xs lg:text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
              <Calendar className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>برنامه فعال</span>
            </div>
            <p className="text-lg lg:text-2xl font-semibold text-foreground">
              {plansLoading ? "—" : stats.activeCount.toLocaleString("fa-IR")}
            </p>
          </div>
          <div className="bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 lg:p-4 text-center hover:border-primary/20 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-center gap-1.5 text-xs lg:text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
              <Layers className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>آرشیو</span>
            </div>
            <p className="text-lg lg:text-2xl font-semibold text-foreground">
              {plansLoading ? "—" : stats.archivedCount.toLocaleString("fa-IR")}
            </p>
          </div>
          <div className="bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-3 lg:p-4 text-center hover:border-primary/20 hover:shadow-md transition-all duration-200 group col-span-2 md:col-span-1">
            <div className="flex items-center justify-center gap-1.5 text-xs lg:text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
              <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              <span>پلن فعلی</span>
            </div>
            <p className="text-sm lg:text-base font-medium text-primary truncate">
              {stats.planLabel}
            </p>
          </div>
          <div className="hidden lg:flex flex-col bg-card/80 dark:bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center hover:border-primary/20 hover:shadow-md transition-all duration-200 group">
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-1 group-hover:text-primary transition-colors">
              <LayoutGrid className="w-4 h-4" />
              <span>کل برنامه‌ها</span>
            </div>
            <p className="text-2xl font-semibold text-foreground">
              {plansLoading ? "—" : stats.total.toLocaleString("fa-IR")}
            </p>
          </div>
        </div>

        <div className="bg-card/80 dark:bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-4 sm:p-6 lg:p-8">
          <PlansScreen />
        </div>

        <div className="text-center">
          <p className="text-xs lg:text-sm text-muted-foreground">
            برای تغییر برنامه فعال، روی گزینه{" "}
            <span className="text-foreground font-medium">فعال‌سازی</span> کلیک
            کن
          </p>
        </div>
      </div>
    </div>
  );
}
