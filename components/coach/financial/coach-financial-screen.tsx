"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCoachEarnings } from "@/hooks/use-coach-earnings";

import { EarningsSummaryCards } from "./earnings-summary-cards";
import { SalesHistoryList } from "./sales-history-list";
import { FinancialEmptyState } from "./financial-empty-state";

export function CoachFinancialScreen() {
  const { summary, sales, isLoading, error, refetch, isEmpty } =
    useCoachEarnings();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">مالی مربی</h1>
          <p className="text-sm text-muted-foreground mt-1">
            درآمد ماه، کمیسیون و تاریخچه فروش برنامه‌ها
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => refetch()}
          aria-label="بروزرسانی"
        >
          <RefreshCw className="size-4" />
        </Button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-30 rounded-2xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Error */}
      {!isLoading && error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center space-y-3">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            تلاش مجدد
          </Button>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {summary && <EarningsSummaryCards summary={summary} />}

          {/* Total commission strip */}
          {summary && summary.totalCommission > 0 && (
            <Card className="bg-primary/10 border-primary/20 backdrop-blur-md">
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">
                    مجموع کمیسیون تا امروز
                  </p>
                  <p className="text-lg font-bold text-primary tabular-nums mt-0.5">
                    {summary.totalCommission.toLocaleString("fa-IR")} تومان
                  </p>
                </div>
                <p className="text-[11px] text-muted-foreground text-left max-w-40">
                  وضعیت:{" "}
                  {summary.withdrawalStatus === "available"
                    ? "آماده درخواست برداشت"
                    : summary.withdrawalStatus === "pending"
                      ? "در حال پردازش"
                      : summary.withdrawalStatus === "paid"
                        ? "پرداخت‌شده"
                        : "مسدود"}
                </p>
              </CardContent>
            </Card>
          )}

          {isEmpty ? (
            <FinancialEmptyState />
          ) : (
            <SalesHistoryList sales={sales} />
          )}
        </>
      )}

      <p className="text-center text-[11px] text-muted-foreground pt-2 pb-4">
        در MVP امکان برداشت آنلاین وجود ندارد. فقط نمایش درآمد و تاریخچه فروش
        فعال است. کمیسیون نمایشی: حدود ۲۰–۲۵٪.
      </p>
    </div>
  );
}
