"use client";

import Link from "next/link";
import {
  Users,
  UserCheck,
  Store,
  ArrowLeft,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/* -------------------------------------------------------------------------- */
/*                                Config                                      */
/* -------------------------------------------------------------------------- */

type AdminSection = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  ring: string;
};

const sections: AdminSection[] = [
  {
    href: "/admin/users",
    title: "کاربران",
    description: "مدیریت نقش، وضعیت و مشاهده لیست کاربران",
    icon: Users,
    accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    ring: "group-hover:ring-sky-500/30",
  },
  {
    href: "/admin/coaches",
    title: "مربیان",
    description: "تأیید، رد یا معلق کردن درخواست‌های مربیگری",
    icon: UserCheck,
    accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    ring: "group-hover:ring-emerald-500/30",
  },
  {
    href: "/admin/stores",
    title: "فروشندگان",
    description: "بررسی و تأیید درخواست‌های فروشگاهی",
    icon: Store,
    accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    ring: "group-hover:ring-violet-500/30",
  },
];

/* -------------------------------------------------------------------------- */
/*                            Section card                                    */
/* -------------------------------------------------------------------------- */

function SectionCard({ section }: { section: AdminSection }) {
  const Icon = section.icon;
  return (
    <Link
      href={section.href}
      className={cn(
        "group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
      )}
    >
      <Card
        className={cn(
          "h-full border-border transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5",
          "ring-1 ring-transparent",
          section.ring,
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-semibold text-foreground">
              {section.title}
            </CardTitle>
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {section.description}
            </p>
          </div>
          <span
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
              section.accent,
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        </CardHeader>
        <CardContent className="pt-0">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors group-hover:text-primary">
            مشاهده
            <ArrowLeft
              className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6 sm:space-y-8">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
          <span>پنل مدیریت</span>
        </div>
        <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          داشبورد ادمین
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          مدیریت کلی پلتفرم سپندتن
        </p>
      </header>

      {/* ---------------------------- Quick stats --------------------------- */}
      <section aria-label="خلاصه وضعیت" className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="کاربران"
          value="—"
          hint="کل کاربران پلتفرم"
          icon={Users}
          tone="sky"
        />
        <StatCard
          label="مربیان"
          value="—"
          hint="درخواست‌های در انتظار"
          icon={UserCheck}
          tone="emerald"
        />
        <StatCard
          label="فروشندگان"
          value="—"
          hint="درخواست‌های در انتظار"
          icon={Store}
          tone="violet"
        />
      </section>

      {/* --------------------------- Section grid --------------------------- */}
      <section aria-label="بخش‌های مدیریت" className="space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-foreground">
            بخش‌های مدیریت
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <SectionCard key={section.href} section={section} />
          ))}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Stat card                                     */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: "sky" | "emerald" | "violet";
}) {
  const tones: Record<typeof tone, string> = {
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };

  return (
    <Card className="border-border">
      <CardContent className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {hint}
          </p>
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            tones[tone],
          )}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
