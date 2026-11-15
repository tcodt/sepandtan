"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Settings, Shield, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProfileHeader } from "./profile-header";
import { ProfileForm } from "./profile-form";
import { AccountSubscriptionSection } from "./account-subscription-section";
import { AccountSummaryCards } from "./account-summary-cards";
import { BecomeCoachCard } from "./become-coach-card";
import { CoachAccountSection } from "./coach-account-section";
import { AddressesSection } from "./addresses-section";
import { useUserStore } from "@/lib/store/user-store";
import {
  getAccountPageLinks,
  type NavContext,
  type ResolvedNavItem,
} from "@/features/auth/nav-config";
import { getHomePathForRole } from "@/features/onboarding/utils";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Role helpers                                                               */
/* -------------------------------------------------------------------------- */

function roleLabel(role: string | undefined): string {
  switch (role) {
    case "admin":
      return "ادمین";
    case "seller":
      return "فروشنده";
    case "coach":
      return "مربی";
    case "trainee":
      return "ورزشکار";
    default:
      return "کاربر";
  }
}

function backMeta(role: string | undefined): { href: string; label: string } {
  if (!role) return { href: "/dashboard", label: "داشبورد" };
  return {
    href: getHomePathForRole(role as "trainee" | "coach" | "seller" | "admin"),
    label:
      role === "seller"
        ? "پنل فروشنده"
        : role === "coach"
          ? "پنل مربی"
          : role === "admin"
            ? "پنل ادمین"
            : "داشبورد",
  };
}

/* -------------------------------------------------------------------------- */
/* Quick links from nav-config                                                */
/* -------------------------------------------------------------------------- */

function AccountQuickLinks({
  items,
  className,
}: {
  items: ResolvedNavItem[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className={cn("space-y-2", className)}>
      <h2 className="px-0.5 text-sm font-semibold text-foreground">
        دسترسی سریع
      </h2>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-2xl border border-border bg-card/80 p-4 backdrop-blur-sm transition-all dark:bg-card/60",
                  "hover:border-primary/30 hover:bg-accent/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                )}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                </div>
                <ArrowLeft
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export function AccountScreen() {
  const user = useUserStore((s) => s.user);
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);

  const isCoach = user?.role === "coach";
  const isSeller = user?.role === "seller";
  const isAdmin = user?.role === "admin";
  const isTrainee = user?.role === "trainee";

  const ctx: NavContext = {
    user,
    isAuthenticated: Boolean(isAuthenticated && user),
  };

  /**
   * لینک‌های صفحه حساب از nav-config
   * dashboard و settings را از گرید حذف می‌کنیم (در هدر هستند)
   */
  const quickLinks = getAccountPageLinks(ctx).filter(
    (item) => item.id !== "dashboard" && item.id !== "settings",
  );

  const back = backMeta(user?.role);

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
            <Link href={back.href}>
              <ArrowRight className="size-4" />
              <span className="hidden sm:inline">{back.label}</span>
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

        {/* Profile card */}
        <div className="rounded-2xl border border-border/50 bg-linear-to-br from-primary/5 via-background/30 to-transparent p-4 backdrop-blur-sm sm:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="rounded-full text-[11px]">
              {roleLabel(user?.role)}
            </Badge>
            {user?.roleStatus &&
              user.role !== "trainee" &&
              user.role !== "admin" && (
                <Badge
                  variant={
                    user.roleStatus === "approved" ? "default" : "outline"
                  }
                  className="rounded-full text-[11px]"
                >
                  {user.roleStatus === "approved"
                    ? "تأیید‌شده"
                    : user.roleStatus === "pending"
                      ? "در انتظار تأیید"
                      : user.roleStatus}
                </Badge>
              )}
          </div>
          <ProfileHeader />
        </div>

        {/* Role-specific blocks */}
        {isCoach && <CoachAccountSection />}

        {isTrainee && (
          <>
            <AccountSummaryCards />
            <AccountSubscriptionSection />
          </>
        )}

        {/* Dynamic quick links — trainee / seller / coach / admin */}
        <AccountQuickLinks items={quickLinks} />

        {/* Become coach — فقط trainee بدون قفل seller */}
        {isTrainee && user?.professionalRoleLock !== "seller" && (
          <BecomeCoachCard />
        )}

        {/* Addresses — از API؛ ادمین معمولاً نیاز ندارد */}
        {!isAdmin && <AddressesSection />}

        {/* Profile edit */}
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
            : isSeller
              ? "سفارش‌ها و محصولات فروشگاه از پنل فروشنده مدیریت می‌شوند"
              : "تغییرات در سرور ذخیره می‌شوند و روی برنامه و سفارش‌ها اثر می‌گذارند"}
        </p>
      </div>
    </div>
  );
}
