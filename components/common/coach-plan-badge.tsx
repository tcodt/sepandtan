"use client";

import { UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type CoachPlanBadgeProps = {
  coachName?: string | null;
  size?: "sm" | "md";
  className?: string;
};

export function CoachPlanBadge({
  coachName,
  size = "sm",
  className,
}: CoachPlanBadgeProps) {
  const label = coachName ? `برنامه مربی · ${coachName}` : "برنامه مربی";

  return (
    <Badge
      className={cn(
        "rounded-full border-0 gap-1.5 font-medium",
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        size === "sm" && "text-[10px] sm:text-xs px-2.5 py-0.5",
        size === "md" && "text-xs sm:text-sm px-3 py-1",
        className,
      )}
      aria-label={label}
    >
      <UserRound className={cn(size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5")} />
      <span className="truncate max-w-37.5 sm:max-w-47.5">{label}</span>
    </Badge>
  );
}
