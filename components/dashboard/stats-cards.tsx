"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Activity, Flame, Target, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

type StatItem = {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ElementType;
};

// ==================== MOCK DATA ====================
// بعداً از API یا Zustand بگیر
const stats: StatItem[] = [
  {
    label: "وزن فعلی",
    value: "۷۲.۴ کیلو",
    change: "−۰.۸ از هفته قبل",
    changeType: "positive",
    icon: TrendingDown,
  },
  {
    label: "کالری امروز",
    value: "۱٬۸۴۰",
    change: "از ۲٬۱۰۰ هدف",
    changeType: "neutral",
    icon: Flame,
  },
  {
    label: "تمرین این هفته",
    value: "۴ از ۵",
    change: "۸۰٪ تکمیل",
    changeType: "positive",
    icon: Activity,
  },
  {
    label: "هدف اصلی",
    value: "کاهش وزن",
    change: "در حال پیشرفت",
    changeType: "positive",
    icon: Target,
  },
];
// ==================================================

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm"
          >
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-lg sm:text-xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  {stat.change && (
                    <p
                      className={cn(
                        "text-[11px] sm:text-xs",
                        stat.changeType === "positive" &&
                          "text-green-600 dark:text-green-400",
                        stat.changeType === "negative" && "text-red-500",
                        stat.changeType === "neutral" &&
                          "text-muted-foreground",
                      )}
                    >
                      {stat.change}
                    </p>
                  )}
                </div>
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
