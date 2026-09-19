"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bot,
  UserRound,
  CalendarDays,
  Archive,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Clock,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { PlanAccessState } from "./plan-access-state";
import { PlanSwitchConfirmSheet } from "./plan-switch-confirm-sheet";
import { useUserStore } from "@/lib/store/user-store";
import { usePlanStore } from "@/lib/store/plan-store";
import { getPlansByUser, switchActivePlan } from "@/lib/api/plans";
import { canSwitchPlan } from "@/lib/subscription/access";
import type { Plan } from "@/lib/types/plan";

function PlanCard({
  plan,
  isActive,
  currentDay,
  canActivate,
  onActivate,
  onUpgrade,
}: {
  plan: Plan;
  isActive: boolean;
  currentDay?: number;
  canActivate: boolean;
  onActivate?: () => void;
  onUpgrade?: () => void;
}) {
  const SourceIcon = plan.source === "coach" ? UserRound : Bot;
  const sourceText = plan.source === "coach" ? "مربی" : "هوش مصنوعی";
  const progress = currentDay ? (currentDay / plan.durationDays) * 100 : 0;

  return (
    <Card
      className={cn(
        "border-border/50 bg-muted/50 backdrop-blur-sm transition-all duration-300",
        "hover:border-primary/20 hover:shadow-md hover:shadow-primary/5",
        isActive &&
          "border-primary/30 shadow-sm shadow-primary/10 bg-primary/5",
        !isActive && "opacity-90 hover:opacity-100",
      )}
    >
      <CardContent className="p-4 sm:p-5 lg:p-6 space-y-3 lg:space-y-4">
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5 lg:gap-2">
            {isActive ? (
              <Badge className="rounded-full text-[10px] lg:text-xs bg-primary/15 text-primary border-0 gap-1">
                <CheckCircle2 className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                فعال
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="rounded-full text-[10px] lg:text-xs gap-1 text-muted-foreground"
              >
                <Archive className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
                آرشیو
              </Badge>
            )}
            <Badge
              variant="outline"
              className="rounded-full text-[10px] lg:text-xs gap-1 font-normal bg-background/50"
            >
              <SourceIcon className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
              {sourceText}
            </Badge>
          </div>
          {isActive && (
            <div className="flex items-center gap-1 text-xs lg:text-sm text-muted-foreground">
              <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
              <span>{progress.toFixed(0)}%</span>
            </div>
          )}
        </div>

        {/* Title & Info */}
        <div>
          <h3 className="text-sm lg:text-base font-semibold text-foreground leading-snug">
            {plan.title}
          </h3>
          <div className="flex flex-wrap items-center gap-2 lg:gap-3 mt-1.5 lg:mt-2">
            <p className="text-xs lg:text-sm text-muted-foreground inline-flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
              {isActive && currentDay
                ? `روز ${currentDay.toLocaleString("fa-IR")} از ${plan.durationDays.toLocaleString("fa-IR")}`
                : `${plan.durationDays.toLocaleString("fa-IR")} روزه`}
            </p>
            {isActive && (
              <div className="flex-1 min-w-15 max-w-25 lg:max-w-37.5">
                <div className="h-1.5 lg:h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 lg:pt-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-8 lg:h-9 gap-1"
            >
              <Link href={`/plans/${plan.id}`}>مشاهده</Link>
            </Button>

            {isActive ? (
              <Button asChild size="sm" className="h-8 lg:h-9 gap-1">
                <Link href="/workout/today">
                  <span>امروز</span>
                  <ArrowRight className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                </Link>
              </Button>
            ) : canActivate ? (
              <Button
                size="sm"
                variant="outline"
                className="h-8 lg:h-9 gap-1 hover:border-primary/50 hover:bg-primary/5"
                onClick={onActivate}
              >
                <Sparkles className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                فعال‌سازی
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-8 lg:h-9 gap-1 text-muted-foreground"
                onClick={onUpgrade}
              >
                <AlertCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                ارتقا برای فعال‌سازی
              </Button>
            )}
          </div>

          {!isActive && plan.createdAt && (
            <span className="text-[10px] lg:text-xs text-muted-foreground">
              {new Date(plan.createdAt).toLocaleDateString("fa-IR")}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function PlansScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const updateProfile = useUserStore((s) => s.updateProfile);
  const loadPlan = usePlanStore((s) => s.loadPlan);
  const currentDayNumber = usePlanStore((s) => s.currentDayNumber);

  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Plan | null>(null);
  const [switching, setSwitching] = useState(false);

  const allowed = canSwitchPlan(user);

  const refresh = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const list = await getPlansByUser(user.id);
      setPlans(list);
    } catch (e) {
      console.error(e);
      toast.error("بارگذاری برنامه‌ها ناموفق بود");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const activePlan = useMemo(
    () => plans.find((p) => p.id === user?.currentPlanId) ?? null,
    [plans, user?.currentPlanId],
  );

  const archived = useMemo(
    () =>
      plans
        .filter((p) => p.id !== user?.currentPlanId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [plans, user?.currentPlanId],
  );

  const handleConfirmSwitch = async () => {
    if (!user?.id || !pending || !allowed) return;
    setSwitching(true);
    try {
      await switchActivePlan({
        userId: user.id,
        previousPlanId: user.currentPlanId,
        nextPlanId: pending.id,
      });
      updateProfile({ currentPlanId: pending.id });
      await loadPlan(pending.id);
      toast.success("برنامه فعال با موفقیت تغییر کرد");
      setPending(null);
      router.replace("/dashboard");
    } catch (e) {
      console.error(e);
      toast.error("تغییر برنامه ناموفق بود");
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3">
        <div className="relative">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full bg-primary animate-pulse" />
          </div>
        </div>
        <p className="text-sm lg:text-base text-muted-foreground">
          در حال بارگذاری برنامه‌ها...
        </p>
      </div>
    );
  }

  if (plans.length === 0) {
    return <PlanAccessState variant="no-plan" />;
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Active Plan Section */}
      <section className="space-y-3 lg:space-y-4">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-1 h-5 lg:h-6 rounded-full bg-primary" />
          <h2 className="text-sm lg:text-base font-semibold text-foreground">
            برنامه فعال
          </h2>
          <Badge
            variant="outline"
            className="text-[10px] lg:text-xs font-normal"
          >
            فعلی
          </Badge>
          {activePlan && (
            <span className="hidden lg:inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3.5 h-3.5" />
              شروع شده در{" "}
              {new Date(activePlan.createdAt).toLocaleDateString("fa-IR")}
            </span>
          )}
        </div>
        {activePlan ? (
          <PlanCard
            plan={activePlan}
            isActive
            currentDay={currentDayNumber}
            canActivate={false}
          />
        ) : (
          <div className="bg-muted/30 rounded-xl p-6 lg:p-8 text-center border border-dashed border-border">
            <p className="text-sm lg:text-base text-muted-foreground">
              هیچ برنامه فعالی انتخاب نشده
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => router.push("/#plans")}
            >
              انتخاب برنامه جدید
            </Button>
          </div>
        )}
      </section>

      {/* Archived Plans Section */}
      <section className="space-y-3 lg:space-y-4">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-1 h-5 lg:h-6 rounded-full bg-muted-foreground/30" />
          <h2 className="text-sm lg:text-base font-semibold text-foreground">
            برنامه‌های قبلی
          </h2>
          {archived.length > 0 && (
            <Badge
              variant="secondary"
              className="text-[10px] lg:text-xs font-normal"
            >
              {archived.length} برنامه
            </Badge>
          )}
        </div>
        {archived.length === 0 ? (
          <div className="bg-muted/20 rounded-xl p-6 lg:p-8 text-center border border-dashed border-border/50">
            <Archive className="w-8 h-8 lg:w-10 lg:h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs lg:text-sm text-muted-foreground">
              برنامه آرشیو‌شده‌ای نداری
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
            {archived.map((p) => (
              <PlanCard
                key={p.id}
                plan={p}
                isActive={false}
                canActivate={allowed}
                onActivate={() => setPending(p)}
                onUpgrade={() => router.push("/#plans")}
              />
            ))}
          </div>
        )}
      </section>

      {/* Switch Confirmation Sheet */}
      <PlanSwitchConfirmSheet
        open={!!pending}
        onOpenChange={(o) => {
          if (!o && !switching) setPending(null);
        }}
        currentTitle={activePlan?.title}
        nextTitle={pending?.title}
        loading={switching}
        onConfirm={handleConfirmSwitch}
      />
    </div>
  );
}
