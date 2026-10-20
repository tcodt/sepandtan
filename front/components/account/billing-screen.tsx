"use client";

import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/store/user-store";
import { usePayments } from "@/hooks/use-payments";

import { SubscriptionStatusCard } from "./subscription-status-card";
import { PaymentSummaryCard } from "./payment-summary-card";
import { PaymentHistoryList } from "./payment-history-list";
import { BillingEmptyState } from "./billing-empty-state";
import { HistorySkeleton, SummarySkeleton } from "./billing-skeleton";

export function BillingScreen() {
  const user = useUserStore((s) => s.user);
  const { payments, summary, isLoading, error, refetch, isEmpty } =
    usePayments();

  return (
    <div className="min-h-dvh bg-muted">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-3 px-4 sm:h-16 sm:px-6">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="size-11 shrink-0 rounded-xl"
            >
              <Link href="/account" aria-label="بازگشت به حساب کاربری">
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <h1 className="truncate text-base font-semibold sm:text-lg">
              مالی و اشتراک
            </h1>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
            aria-label="بروزرسانی اطلاعات"
            className="size-11 shrink-0 rounded-xl"
          >
            <RefreshCw
              className={`size-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </header>

      {/* Main */}
      <main
        aria-busy={isLoading}
        className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8"
      >
        <div className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3 lg:gap-6">
          {/* Left column: subscription + summary */}
          <div className="space-y-4 sm:space-y-5 lg:col-span-1">
            <SubscriptionStatusCard
              tier={user?.subscriptionStatus}
              expiresAt={user?.subscriptionExpiresAt}
            />

            {isLoading && <SummarySkeleton />}

            {!isLoading && error && (
              <div
                role="alert"
                className="space-y-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-center"
              >
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => refetch()}
                  className="rounded-xl"
                >
                  تلاش مجدد
                </Button>
              </div>
            )}

            {!isLoading && !error && summary && summary.paymentCount > 0 && (
              <PaymentSummaryCard
                totalPaid={summary.totalPaid}
                paymentCount={summary.paymentCount}
              />
            )}
          </div>

          {/* Right column: history / empty */}
          <div className="space-y-4 sm:space-y-5 lg:col-span-2">
            {isLoading && <HistorySkeleton />}

            {!isLoading && !error && isEmpty && <BillingEmptyState />}

            {!isLoading && !error && !isEmpty && (
              <PaymentHistoryList payments={payments} />
            )}
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-md pb-8 text-center text-[11px] leading-relaxed text-muted-foreground sm:mt-8">
          کیف پول در این نسخه وجود ندارد. فقط وضعیت اشتراک و تاریخچه پرداخت
          نمایش داده می‌شود.
        </p>
      </main>
    </div>
  );
}
