"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PlanAccess } from "@/lib/types/access";
import { cn } from "@/lib/utils";

export function statusLabel(status: PlanAccess["status"]) {
  switch (status) {
    case "active":
      return "فعال";
    case "expired":
      return "منقضی";
    case "pending_activation":
      return "در انتظار فعال‌سازی";
    default:
      return status;
  }
}

export function formatAccessDates(access: PlanAccess) {
  if (access.status === "pending_activation" || !access.startDate) {
    return "هنوز فعال نشده";
  }
  const start = new Date(access.startDate).toLocaleDateString("fa-IR");
  const end = access.endDate
    ? new Date(access.endDate).toLocaleDateString("fa-IR")
    : "—";
  return `${start} تا ${end}`;
}

/** Returns { label, tone } describing time remaining/elapsed */
function getTimeHint(access: PlanAccess): {
  label: string;
  tone: "active" | "warning" | "expired" | "pending";
} | null {
  if (access.status === "pending_activation" || !access.endDate) return null;

  const now = Date.now();
  const end = new Date(access.endDate).getTime();
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24));

  if (access.status === "expired" || diffDays <= 0) {
    const overdue = Math.abs(diffDays);
    return {
      label:
        overdue === 0
          ? "امروز منقضی شد"
          : `${overdue.toLocaleString("fa-IR")} روز پیش منقضی شد`,
      tone: "expired",
    };
  }

  if (diffDays <= 3) {
    return {
      label: `فقط ${diffDays.toLocaleString("fa-IR")} روز مانده`,
      tone: "warning",
    };
  }

  return {
    label: `${diffDays.toLocaleString("fa-IR")} روز مانده`,
    tone: "active",
  };
}

/** 0..100 progress of the access window */
function getProgress(access: PlanAccess): number | null {
  if (!access.startDate || !access.endDate) return null;
  const start = new Date(access.startDate).getTime();
  const end = new Date(access.endDate).getTime();
  if (end <= start) return null;
  const pct = ((Date.now() - start) / (end - start)) * 100;
  return Math.max(0, Math.min(100, pct));
}

type Props = {
  access: PlanAccess;
  onActivate?: (access: PlanAccess) => void;
  onSwitch?: (access: PlanAccess) => void;
  isActivating?: boolean;
};

export function PlanAccessCard({
  access,
  onActivate,
  onSwitch,
  isActivating,
}: Props) {
  const isActive = access.status === "active";
  const isPending = access.status === "pending_activation";
  const isExpired = access.status === "expired";
  const isCoach = access.planSource === "coach";

  const timeHint = getTimeHint(access);
  const progress = isActive ? getProgress(access) : null;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm transition-all",
        "hover:border-primary/30 hover:shadow-sm",
        isActive && "ring-1 ring-primary/30",
      )}
    >
      {/* Accent strip for active plans */}
      {isActive && (
        <span
          aria-hidden
          className="absolute inset-y-0 right-0 w-1 bg-linear-to-b from-primary/80 to-primary/40"
        />
      )}

      <CardContent className="p-4 space-y-3.5">
        {/* Header: title + status pill */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <h3 className="font-semibold text-base leading-snug truncate text-foreground">
              {access.planTitle ?? "برنامه تمرینی"}
            </h3>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {isCoach ? (
                <>
                  <span className="flex size-5 items-center justify-center rounded-full bg-muted shrink-0">
                    <UserRound className="size-3" />
                  </span>
                  <span className="truncate">{access.coachName ?? "مربی"}</span>
                </>
              ) : (
                <>
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
                    <Sparkles className="size-3" />
                  </span>
                  <span>ساخته‌شده با هوش مصنوعی</span>
                </>
              )}
            </div>
          </div>

          <span
            className={cn(
              "shrink-0 inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full font-medium",
              isActive && "bg-primary/15 text-primary",
              isPending && "bg-amber-500/15 text-amber-600 dark:text-amber-400",
              isExpired && "bg-muted text-muted-foreground",
            )}
          >
            {isActive && <CheckCircle2 className="size-3" />}
            {isPending && <Clock className="size-3" />}
            {statusLabel(access.status)}
          </span>
        </div>

        {/* Meta row: duration + dates */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" />
            <span>{access.durationDays.toLocaleString("fa-IR")} روز</span>
          </span>
          <span className="text-border" aria-hidden>
            ·
          </span>
          <span className="truncate">{formatAccessDates(access)}</span>
        </div>

        {/* Time hint + progress bar */}
        {timeHint && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span
                className={cn(
                  "font-medium",
                  timeHint.tone === "active" && "text-primary",
                  timeHint.tone === "warning" &&
                    "text-amber-600 dark:text-amber-400",
                  timeHint.tone === "expired" && "text-muted-foreground",
                )}
              >
                {timeHint.label}
              </span>
              {progress !== null && (
                <span className="text-muted-foreground tabular-nums">
                  {Math.round(progress).toLocaleString("fa-IR")}٪
                </span>
              )}
            </div>

            {progress !== null && (
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    timeHint.tone === "active" && "bg-primary",
                    timeHint.tone === "warning" && "bg-amber-500",
                    timeHint.tone === "expired" && "bg-muted-foreground/40",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-0.5">
          {isPending && onActivate && (
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              disabled={isActivating}
              onClick={() => onActivate(access)}
            >
              <Zap className="size-3.5" />
              {isActivating ? "در حال فعال‌سازی..." : "فعال‌سازی"}
            </Button>
          )}

          {!isActive && !isExpired && !isPending && onSwitch && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => onSwitch(access)}
            >
              تغییر به این برنامه
            </Button>
          )}

          {isExpired && (
            <Button size="sm" variant="outline" className="flex-1" disabled>
              منقضی شده
            </Button>
          )}

          {isActive && (
            <Button asChild size="sm" className="flex-1">
              <Link href={`/plans/${access.planId}`}>مشاهده برنامه</Link>
            </Button>
          )}

          {!isActive && (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="shrink-0 gap-1 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <Link href={`/plans/${access.planId}`} aria-label="جزئیات برنامه">
                جزئیات
                <ArrowLeft className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
