"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Play, Sparkles, UserRound } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { PlanAccess } from "@/lib/types/access";
import { formatAccessDates } from "./plan-access-card";

type Props = {
  access: PlanAccess;
};

export function ActivePlanCard({ access }: Props) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  const daysLeft =
    access.endDate != null && now != null
      ? Math.max(
          0,
          Math.ceil(
            (new Date(access.endDate).getTime() - now) / (1000 * 60 * 60 * 24),
          ),
        )
      : null;

  return (
    <Card className="border-primary/25 bg-primary/5 dark:bg-primary/10 backdrop-blur-sm overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-primary">برنامه فعال</p>
          {daysLeft != null && (
            <span className="text-[11px] rounded-full bg-background/80 px-2 py-0.5 text-muted-foreground">
              {daysLeft} روز باقی‌مانده
            </span>
          )}
        </div>
        <CardTitle className="text-base sm:text-lg leading-snug">
          {access.planTitle ?? "برنامه تمرینی"}
        </CardTitle>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-0.5">
          {access.planSource === "coach" ? (
            <>
              <UserRound className="size-3.5" />
              <span>{access.coachName ?? "مربی"}</span>
            </>
          ) : (
            <>
              <Sparkles className="size-3.5" />
              <span>هوش مصنوعی</span>
            </>
          )}
          <span className="opacity-50">·</span>
          <span>{formatAccessDates(access)}</span>
        </div>
      </CardHeader>

      <CardContent className="pt-2 flex flex-col sm:flex-row gap-2">
        <Button asChild className="flex-1 gap-2">
          <Link href="/workout/today">
            <Play className="size-4" />
            تمرین امروز
          </Link>
        </Button>
        <Button
          variant="outline"
          className="flex-1 gap-2"
          disabled
          title="در فاز PDF فعال می‌شود"
        >
          <Download className="size-4" />
          دانلود PDF
        </Button>
        <Button asChild variant="ghost" size="sm" className="sm:px-3">
          <Link href={`/plans/${access.planId}`}>جزئیات</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
