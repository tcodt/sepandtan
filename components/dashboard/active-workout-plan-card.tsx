"use client";

import Link from "next/link";
import {
  Bot,
  UserRound,
  CalendarDays,
  ChevronLeft,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUserPlan } from "@/hooks/use-user-plan";
import {
  getSubscriptionLabel,
  getFreeTrialDaysLeft,
  isFreeTrialExpired,
} from "@/lib/subscription/access";
import { cn } from "@/lib/utils";
import { CoachPlanBadge } from "@/components/common/coach-plan-badge";

const LEVEL_FA = {
  beginner: "مبتدی",
  intermediate: "متوسط",
  advanced: "پیشرفته",
} as const;

export function ActiveWorkoutPlanCard() {
  const { user, plan, currentDayNumber, isLoading, hasPlan, error } =
    useUserPlan();

  const isCoachPlan = plan?.source === "coach";

  // بدون currentPlanId → کارت را نشان نده (Empty State جایگزین می‌شود)
  if (!user?.currentPlanId) return null;

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/80 dark:bg-card/60 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-10">
          <Loader2
            className="w-6 h-6 animate-spin text-primary"
            aria-label="بارگذاری"
          />
        </CardContent>
      </Card>
    );
  }

  if (error || !hasPlan || !plan) return null;

  const subLabel = getSubscriptionLabel(
    user.subscriptionStatus,
    user.currentPlanId,
  );
  const trialLeft = getFreeTrialDaysLeft(user);
  const trialExpired = isFreeTrialExpired(user);
  const SourceIcon = plan.source === "coach" ? UserRound : Bot;
  const sourceText =
    plan.source === "coach" ? "مربی تأییدشده" : "ساخته‌شده با هوش مصنوعی";

  return (
    <Card
      className={cn(
        "border-primary/25 bg-card/80 dark:bg-card/60 backdrop-blur-md",
        "shadow-sm shadow-primary/5",
        trialExpired && "border-amber-500/30",
      )}
    >
      <CardContent className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full text-[10px] sm:text-xs bg-primary/15 text-primary border-0 gap-1">
            <Sparkles className="w-3 h-3" />
            برنامه فعال
          </Badge>

          {isCoachPlan ? (
            <CoachPlanBadge coachName={plan.coachId ?? null} />
          ) : (
            <Badge
              variant="outline"
              className="rounded-full text-[10px] sm:text-xs font-normal gap-1"
            >
              <Bot className="w-3 h-3" />
              ساخته‌شده با هوش مصنوعی
            </Badge>
          )}

          <Badge
            variant="outline"
            className="rounded-full text-[10px] sm:text-xs font-normal"
          >
            {subLabel}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-bold text-foreground leading-snug">
            {plan.title}
          </h3>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <SourceIcon className="w-3.5 h-3.5 shrink-0" />
            {sourceText}
          </p>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 shrink-0" />
            {LEVEL_FA[plan.level]} · روز{" "}
            {currentDayNumber.toLocaleString("fa-IR")} از{" "}
            {plan.durationDays.toLocaleString("fa-IR")}
          </p>
        </div>

        {/* Free trial hint */}
        {user.subscriptionStatus === "free" &&
          trialLeft !== null &&
          !trialExpired && (
            <p className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400">
              {trialLeft.toLocaleString("fa-IR")} روز باقی‌مانده از دوره آزمایشی
            </p>
          )}

        {trialExpired && (
          <p className="text-[11px] sm:text-xs text-amber-600 dark:text-amber-400">
            دوره آزمایشی تموم شده. برای ادامه، اشتراکت رو ارتقا بده.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
          {trialExpired ? (
            <Button
              asChild
              className="h-11 flex-1 font-semibold" // Removed size="sm"
            >
              <Link href="/#plans">ارتقا برای ادامه</Link>
            </Button>
          ) : (
            <Button
              asChild
              className="h-11 flex-1 font-semibold gap-1" // Removed size="sm"
            >
              <Link href="/workout/today">
                مشاهده امروز
                <ChevronLeft className="w-4 h-4" />
              </Link>
            </Button>
          )}
          <Button
            asChild
            variant="outline"
            className="h-11 flex-1" // Removed size="sm"
          >
            <Link href="/plans">برنامه‌های من</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
