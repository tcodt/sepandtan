"use client";

import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CreditCard,
  Settings,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "./profile-header";
import { ProfileForm } from "./profile-form";
import { AccountSubscriptionSection } from "./account-subscription-section";
import { AccountSummaryCards } from "./account-summary-cards";
import { BecomeCoachCard } from "./become-coach-card";
import { CoachAccountSection } from "./coach-account-section";
import { useUserStore } from "@/lib/store/user-store";
import { cn } from "@/lib/utils";

/* ---------- Sub-components ---------- */

function FinancialLink({ className }: { className?: string }) {
  return (
    <Link
      href="/account/billing"
      aria-label="مالی و اشتراک"
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm p-4 transition-all",
        "hover:bg-accent/40 hover:border-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        className,
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
        <CreditCard className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">مالی و اشتراک</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          وضعیت اشتراک، تاریخ انقضا و تاریخچه پرداخت
        </p>
      </div>

      <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
    </Link>
  );
}

/* ---------- Screen ---------- */

export function AccountScreen() {
  const user = useUserStore((s) => s.user);
  const isCoach = user?.role === "coach";

  return (
    <div className="min-h-screen bg-muted pb-20 lg:pb-8">
      <div className="mx-auto w-full max-w-4xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ms-2 gap-1.5 text-muted-foreground hover:text-foreground"
          >
            <Link href={isCoach ? "/coach" : "/dashboard"}>
              <ArrowRight className="size-4" />
              <span className="hidden sm:inline">
                {isCoach ? "پنل مربی" : "داشبورد"}
              </span>
            </Link>
          </Button>

          <h1 className="flex items-center gap-2 text-lg font-bold text-foreground sm:text-xl lg:text-2xl">
            <User className="size-5 text-primary sm:size-6" />
            <span>حساب کاربری</span>
          </h1>

          <Button
            variant="ghost"
            size="icon"
            asChild
            className="size-9 rounded-full sm:size-10"
          >
            <Link href="/settings" aria-label="تنظیمات">
              <Settings className="size-4 sm:size-5" />
            </Link>
          </Button>
        </div>

        {/* Profile Header */}
        <div className="rounded-2xl border border-border/50 bg-linear-to-br from-primary/5 via-background/30 to-transparent p-4 backdrop-blur-sm sm:p-6">
          <ProfileHeader />
        </div>

        {/* Role-based content */}
        {isCoach ? (
          <>
            <CoachAccountSection />
            <FinancialLink />
          </>
        ) : (
          <>
            <AccountSummaryCards />
            <FinancialLink />
            <AccountSubscriptionSection />
            <BecomeCoachCard />
          </>
        )}

        {/* Shared edit form */}
        <div className="rounded-2xl border border-border/50 bg-card/80 p-4 backdrop-blur-sm dark:bg-card/60 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
            <Shield className="size-4 text-primary" />
            ویرایش اطلاعات
          </h2>
          <ProfileForm />
        </div>

        <p className="pb-2 text-center text-[11px] text-muted-foreground sm:text-xs">
          {isCoach
            ? "اطلاعات پروفایل مربی در پنل و صفحه عمومی مربیان نمایش داده می‌شود"
            : "تغییرات بدنی و هدف روی پیشنهادهای برنامه و داشبورد اثر می‌گذارند"}
        </p>
      </div>
    </div>
  );
}
