"use client";

import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

type TodayHeaderProps = {
  completedCount: number;
  totalCount: number;
  title?: string;
};

export function TodayHeader({
  completedCount,
  totalCount,
  title = "برنامه امروز",
}: TodayHeaderProps) {
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="gap-1.5 -mr-2">
          <Link href="/dashboard">
            <ArrowRight className="w-4 h-4" />
            داشبورد
          </Link>
        </Button>

        <div className="flex items-center gap-2 text-primary">
          <Flame className="w-4 h-4" />
          <span className="text-sm font-medium">سپندتن</span>
        </div>
      </div>

      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {title}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {completedCount} از {totalCount} حرکت انجام شده
        </p>
      </div>

      <Progress value={progress} className="h-2" />
    </div>
  );
}
