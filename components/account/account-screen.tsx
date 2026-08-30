"use client";

import Link from "next/link";
import { ArrowRight, Settings, User, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "./profile-header";
import { ProfileForm } from "./profile-form";
import { AccountSubscriptionSection } from "./account-subscription-section";
import { AccountSummaryCards } from "./account-summary-cards";

export function AccountScreen() {
  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -ml-2">
            <Link href="/dashboard">
              <ArrowRight className="w-4 h-4" />
              <span className="hidden sm:inline">داشبورد</span>
            </Link>
          </Button>

          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            <span>حساب کاربری</span>
          </h1>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="rounded-full h-9 w-9 sm:h-10 sm:w-10"
            >
              <Link href="/settings" aria-label="تنظیمات">
                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="rounded-2xl border border-border/50 bg-linear-to-br from-primary/5 via-muted/30 to-transparent backdrop-blur-sm p-4 sm:p-6">
          <ProfileHeader />
        </div>

        {/* Summary Cards */}
        <AccountSummaryCards />

        {/* Subscription Section */}
        <AccountSubscriptionSection />

        {/* Edit Profile Form */}
        <div className="rounded-2xl border border-border/50 bg-muted/30 backdrop-blur-sm p-4 sm:p-6">
          <h2 className="text-sm sm:text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            ویرایش اطلاعات
          </h2>
          <ProfileForm />
        </div>

        {/* Footer Note */}
        <p className="text-center text-[11px] sm:text-xs text-muted-foreground pb-2">
          تغییرات بدنی و هدف روی پیشنهادهای برنامه و داشبورد اثر می‌گذارند
        </p>
      </div>
    </div>
  );
}
