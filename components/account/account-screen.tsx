"use client";

import Link from "next/link";
import { ArrowRight, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProfileHeader } from "./profile-header";
import { ProfileForm } from "./profile-form";

export function AccountScreen() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -mr-2">
            <Link href="/dashboard">
              <ArrowRight className="w-4 h-4" />
              داشبورد
            </Link>
          </Button>
          <h1 className="text-lg font-bold text-foreground">حساب کاربری</h1>
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/settings">
              <Settings className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 dark:bg-card/60 p-5">
          <ProfileHeader />
        </div>

        <div className="rounded-2xl border border-border bg-card/80 dark:bg-card/60 p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            ویرایش اطلاعات
          </h2>
          <ProfileForm />
        </div>

        <p className="text-center text-[11px] text-muted-foreground pb-6">
          تغییرات بدنی و هدف روی پیشنهادهای برنامه و داشبورد اثر می‌گذارند
        </p>
      </div>
    </div>
  );
}
