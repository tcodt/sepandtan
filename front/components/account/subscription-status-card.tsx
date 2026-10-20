"use client";

import { useEffect, useMemo, useState } from "react";
import { Crown, CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SubscriptionStatus } from "@/lib/types/plan";
import { cn } from "@/lib/utils";

const TIER_LABEL: Record<string, string> = {
  free: "رایگان",
  basic: "بیسیک",
  pro: "پرو",
  premium: "پریمیوم",
  coach_plan: "برنامه مربی",
  ai_plan: "برنامه هوش مصنوعی",
  vip: "VIP",
};

type Props = {
  tier: SubscriptionStatus | undefined;
  expiresAt?: string | null;
};

export function SubscriptionStatusCard({ tier, expiresAt }: Props) {
  const safeTier = tier ?? "free";
  const isPaid = safeTier !== "free";
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
  }, []);

  const expiresDate = useMemo(
    () => (expiresAt ? new Date(expiresAt) : null),
    [expiresAt],
  );

  const expiresLabel = useMemo(
    () =>
      expiresDate
        ? expiresDate.toLocaleDateString("fa-IR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : null,
    [expiresDate],
  );

  const daysLeft = useMemo(() => {
    if (!expiresDate || now == null) return null;
    return Math.max(
      0,
      Math.ceil((expiresDate.getTime() - now) / (1000 * 60 * 60 * 24)),
    );
  }, [expiresDate, now]);

  return (
    <Card
      className={cn(
        "overflow-hidden border-border bg-card/80 backdrop-blur-sm transition-shadow dark:bg-card/60",
        isPaid &&
          "ring-1 ring-primary/25 hover:shadow-md hover:shadow-primary/5",
      )}
    >
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">وضعیت اشتراک</p>
            <div className="flex items-center gap-2">
              <Crown
                className={cn(
                  "size-5 shrink-0",
                  isPaid ? "text-primary" : "text-muted-foreground",
                )}
                aria-hidden
              />
              <h2 className="truncate text-lg font-bold text-foreground">
                {TIER_LABEL[safeTier] ?? safeTier}
              </h2>
            </div>
          </div>

          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
              isPaid
                ? "bg-primary/15 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {isPaid ? "فعال" : "رایگان"}
          </span>
        </div>

        {isPaid && expiresLabel && (
          <div className="flex items-center gap-3 rounded-xl border border-border bg-background/50 px-3 py-2.5">
            <CalendarClock
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">تاریخ انقضا</p>
              <p className="truncate font-medium text-foreground">
                {expiresLabel}
                {daysLeft != null && (
                  <span className="font-normal text-muted-foreground">
                    {" "}
                    · {daysLeft} روز مانده
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {!isPaid && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            با ارتقا به اشتراک پولی، به برنامه‌های پیشرفته‌تر و امکانات بیشتر
            دسترسی پیدا می‌کنی.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
