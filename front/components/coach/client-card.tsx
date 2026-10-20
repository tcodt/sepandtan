"use client";

import Link from "next/link";
import { ChevronLeft, Scale, Activity, FileText, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type Progress = {
  lastWeight: number | null;
  sessionsLast7Days: number;
  planStatus: string | null;
  currentPlanTitle?: string;
};

type Props = {
  clientId: string;
  clientName: string;
  clientAvatar?: string;
  startedAt: string;
  progress: Progress;
};

const PLAN_STATUS_FA: Record<string, string> = {
  active: "فعال",
  assigned: "اختصاص‌یافته",
  published: "منتشرشده",
  draft: "پیش‌نویس",
  archived: "آرشیو",
};

/** Mode-aware status pill styles. */
const PLAN_STATUS_STYLE: Record<string, string> = {
  active: cn(
    "bg-emerald-500/10 text-emerald-700 border-emerald-500/25",
    "dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/25",
  ),
  assigned: cn(
    "bg-sky-500/10 text-sky-700 border-sky-500/25",
    "dark:text-sky-400 dark:bg-sky-500/10 dark:border-sky-500/25",
  ),
  published: cn(
    "bg-violet-500/10 text-violet-700 border-violet-500/25",
    "dark:text-violet-400 dark:bg-violet-500/10 dark:border-violet-500/25",
  ),
  draft: cn(
    "bg-amber-500/10 text-amber-700 border-amber-500/25",
    "dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/25",
  ),
  archived: cn(
    "bg-muted text-muted-foreground border-border",
    "dark:bg-white/5 dark:text-muted-foreground dark:border-white/10",
  ),
};

export function ClientCard({
  clientId,
  clientName,
  clientAvatar,
  startedAt,
  progress,
}: Props) {
  const initials =
    clientName
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("") || "ه";

  const hasPlan = Boolean(progress.currentPlanTitle);
  const statusKey = progress.planStatus ?? "";
  const statusLabel = PLAN_STATUS_FA[statusKey] ?? progress.planStatus;
  const statusStyle =
    PLAN_STATUS_STYLE[statusKey] ??
    "border-border text-muted-foreground bg-muted";

  const startDate = new Date(startedAt).toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/coach/clients/${clientId}`} className="block group">
      <Card
        className={cn(
          "relative overflow-hidden rounded-2xl transition-all duration-300",
          // LIGHT: real card + soft elevation on bg-muted
          "bg-card border-border shadow-sm shadow-foreground/4",
          "hover:border-primary/40 hover:shadow-md hover:shadow-primary/10",
          "hover:-translate-y-0.5",
          // DARK: glass
          "dark:bg-card dark:border-white/10 dark:backdrop-blur-md dark:shadow-none",
          "dark:hover:border-primary/40 dark:hover:shadow-lg dark:hover:shadow-primary/5",
        )}
      >
        {/* Decorative gradient accent (appears on hover) */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 h-px",
            // LIGHT: stronger gradient
            "bg-linear-to-l from-transparent via-primary/60 to-transparent",
            // DARK
            "dark:via-primary/40",
            "opacity-0 group-hover:opacity-100 transition-opacity",
          )}
        />

        <CardContent className="p-5 space-y-4">
          {/* ---- Header ---- */}
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <Avatar className="h-12 w-12 border-2 border-background ring-1 ring-border">
                {clientAvatar ? (
                  <AvatarImage src={clientAvatar} alt={clientName} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {/* Activity dot */}
              <span
                className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full",
                  "border-2 border-card",
                  progress.sessionsLast7Days > 0
                    ? "bg-emerald-500"
                    : "bg-muted-foreground/40",
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground truncate leading-tight">
                {clientName}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3 shrink-0" />
                <span>شروع از {startDate}</span>
              </div>
            </div>

            <div
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                // LIGHT: muted but visible
                "bg-muted text-muted-foreground",
                "group-hover:bg-primary/10 group-hover:text-primary",
                // DARK
                "dark:bg-white/5 dark:group-hover:bg-primary/15",
                "transition-colors",
              )}
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            </div>
          </div>

          {/* ---- Stats ---- */}
          <div className="grid grid-cols-2 gap-2.5">
            <StatTile
              icon={<Scale className="w-4 h-4" />}
              value={
                progress.lastWeight != null
                  ? progress.lastWeight.toLocaleString("fa-IR")
                  : "—"
              }
              label="آخرین وزن"
              unit="kg"
              tone="primary"
            />
            <StatTile
              icon={<Activity className="w-4 h-4" />}
              value={progress.sessionsLast7Days.toLocaleString("fa-IR")}
              label="جلسه ۷ روز"
              tone="emerald"
            />
          </div>

          {/* ---- Plan ---- */}
          <div
            className={cn(
              "rounded-xl border px-3.5 py-3",
              hasPlan
                ? cn(
                    "bg-muted/60 border-border",
                    "dark:bg-white/3 dark:border-white/10",
                  )
                : cn(
                    "bg-muted/40 border-dashed border-border",
                    "dark:bg-white/2 dark:border-white/10",
                  ),
            )}
          >
            {hasPlan ? (
              <div className="flex items-start gap-2.5">
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5",
                    "bg-primary/10 text-primary",
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate leading-tight">
                    {progress.currentPlanTitle}
                  </p>
                  {statusLabel && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "mt-1.5 text-[10px] h-5 px-2 font-medium",
                        statusStyle,
                      )}
                    >
                      {statusLabel}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex items-center justify-center w-7 h-7 rounded-lg shrink-0",
                    "bg-muted text-muted-foreground",
                    "dark:bg-white/5",
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-muted-foreground">
                  هنوز برنامه‌ای فعال نشده
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function StatTile({
  icon,
  value,
  label,
  unit,
  tone,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  unit?: string;
  tone: "primary" | "emerald";
}) {
  const toneStyles = {
    primary: {
      icon: "bg-primary/10 text-primary",
      value: "text-foreground",
    },
    emerald: {
      icon: cn("bg-emerald-500/10 text-emerald-700", "dark:text-emerald-400"),
      value: "text-foreground",
    },
  }[tone];

  return (
    <div
      className={cn(
        "rounded-xl px-3 py-2.5 flex items-center gap-2.5 border",
        // LIGHT: subtle tile on card
        "bg-muted/50 border-border",
        // DARK
        "dark:bg-white/3 dark:border-white/10",
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg shrink-0",
          toneStyles.icon,
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-semibold tabular-nums leading-none",
            toneStyles.value,
          )}
        >
          {value}
          {unit && (
            <span className="text-[10px] font-normal text-muted-foreground mr-1">
              {unit}
            </span>
          )}
        </p>
        <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
      </div>
    </div>
  );
}
