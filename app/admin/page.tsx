"use client";

import Link from "next/link";
import {
  Users,
  UserCheck,
  Store,
  ArrowLeft,
  LayoutDashboard,
  TrendingUp,
  Package,
  Ticket,
  Flag,
  RefreshCw,
  AlertTriangle,
  Tags,
  Loader2,
} from "lucide-react";

import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";

import "swiper/css";
import "swiper/css/free-mode";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminOverview } from "@/features/admin/overview-hooks";
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type AdminSection = {
  href: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  ring: string;
  badge?: string | number | null;
};

type Tone = "sky" | "emerald" | "violet" | "amber" | "rose";

function fa(n: number) {
  return n.toLocaleString("fa-IR");
}

/* -------------------------------------------------------------------------- */
/* Section card                                                               */
/* -------------------------------------------------------------------------- */

function SectionCard({ section }: { section: AdminSection }) {
  const Icon = section.icon;
  return (
    <Link
      href={section.href}
      className="group block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      <Card
        className={cn(
          "flex h-full flex-col border-border transition-all duration-200",
          "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/5",
          "ring-1 ring-transparent",
          section.ring,
        )}
      >
        <CardHeader className="flex flex-row items-start justify-between gap-3 pb-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base font-semibold text-foreground">
                {section.title}
              </CardTitle>
              {section.badge != null && section.badge !== 0 ? (
                <Badge variant="secondary" className="text-[10px] tabular-nums">
                  {typeof section.badge === "number"
                    ? fa(section.badge)
                    : section.badge}
                </Badge>
              ) : null}
            </div>
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
        <CardContent className="mt-auto pt-0">
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
/* Stat card                                                                  */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  href,
  loading,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: Tone;
  href?: string;
  loading?: boolean;
}) {
  const tones: Record<Tone, string> = {
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  const body = (
    <Card className="h-full border-border transition-colors hover:border-primary/20">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums text-foreground">
            {loading ? "…" : value}
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
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          ) : (
            <Icon className="h-5 w-5" aria-hidden="true" />
          )}
        </span>
      </CardContent>
    </Card>
  );

  if (!href) return body;

  return (
    <Link
      href={href}
      className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {body}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminDashboardPage() {
  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminOverview();

  const sections: AdminSection[] = [
    {
      href: "/admin/users",
      title: "کاربران",
      description: "مدیریت نقش، وضعیت و حذف کاربران",
      icon: Users,
      accent: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
      ring: "group-hover:ring-sky-500/30",
      badge: data?.usersTotal ?? null,
    },
    {
      href: "/admin/coaches",
      title: "مربیان",
      description: "تأیید یا رد درخواست مربیگری",
      icon: UserCheck,
      accent: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      ring: "group-hover:ring-emerald-500/30",
      badge: data?.pendingCoaches ?? null,
    },
    {
      href: "/admin/stores",
      title: "فروشندگان",
      description: "بررسی و تأیید درخواست‌های فروشگاهی",
      icon: Store,
      accent: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
      ring: "group-hover:ring-violet-500/30",
      badge: data?.pendingStores ?? null,
    },
    {
      href: "/admin/categories",
      title: "دسته‌بندی‌ها",
      description: "مدیریت درخت دسته‌بندی فروشگاه",
      icon: Tags,
      accent: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      ring: "group-hover:ring-amber-500/30",
    },
  ];

  const kpis: {
    label: string;
    value: string;
    hint: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: Tone;
    href?: string;
  }[] = [
    {
      label: "کاربران",
      value: fa(data?.usersTotal ?? 0),
      hint: "کل ثبت‌نام‌ها",
      icon: Users,
      tone: "sky",
      href: "/admin/users",
    },
    {
      label: "مربی در انتظار",
      value: fa(data?.pendingCoaches ?? 0),
      hint: "نیاز به بررسی",
      icon: UserCheck,
      tone: "emerald",
      href: "/admin/coaches",
    },
    {
      label: "فروشنده در انتظار",
      value: fa(data?.pendingStores ?? 0),
      hint: "نیاز به بررسی",
      icon: Store,
      tone: "violet",
      href: "/admin/stores",
    },
    {
      label: "محصول در انتظار",
      value: fa(data?.products.PENDING ?? 0),
      hint: "تأیید محصول",
      icon: Package,
      tone: "amber",
    },
    {
      label: "تیکت‌ها",
      value: fa(data?.tickets.total ?? 0),
      hint: `باز: ${fa((data?.tickets.pending ?? 0) + (data?.tickets.open ?? 0))}`,
      icon: Ticket,
      tone: "sky",
    },
    {
      label: "گزارش‌ها",
      value: fa(data?.reports.total ?? 0),
      hint: `در انتظار: ${fa(data?.reports.pending ?? 0)}`,
      icon: Flag,
      tone: "rose",
    },
  ];

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
            <span>پنل مدیریت</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            داشبورد ادمین
          </h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            نمای کلی عملیاتی سپندتن
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="shrink-0"
        >
          {isFetching ? (
            <Loader2 className="me-2 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
          )}
          {isFetching ? "در حال به‌روزرسانی…" : "به‌روزرسانی"}
        </Button>
      </header>

      {/* ---------------------------- Error -------------------------------- */}
      {isError && (
        <div
          role="alert"
          className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center"
        >
          <AlertTriangle
            className="h-5 w-5 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">
              خطا در بارگذاری داشبورد
            </p>
            <p className="mt-0.5 wrap-break-word text-xs text-muted-foreground">
              {error instanceof Error ? error.message : "خطای ناشناخته"}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="shrink-0"
          >
            <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
            تلاش دوباره
          </Button>
        </div>
      )}

      {/* ----------------------- Partial errors ---------------------------- */}
      {data && data.partialErrors.length > 0 && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 sm:flex-row sm:items-start"
        >
          <AlertTriangle
            className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1 text-xs text-amber-700 dark:text-amber-300">
            <p className="font-medium">بخشی از داده‌ها بارگذاری نشد</p>
            <p className="mt-1 text-muted-foreground">
              منبع‌های در دسترس نبوده:{" "}
              <span className="font-mono" dir="ltr">
                {data.partialErrors.join(", ")}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------ KPI strip -------------------------- */}
      <section aria-label="شاخص‌های کلیدی" className="min-w-0">
        {/* Mobile / tablet: swipeable strip */}
        <div className="lg:hidden">
          <Swiper
            modules={[FreeMode]}
            freeMode
            spaceBetween={12}
            slidesPerView={2}
            breakpoints={{
              480: { slidesPerView: 1.6 },
              640: { slidesPerView: 2.2 },
              768: { slidesPerView: 2.6 },
            }}
            className="-mx-4 px-4 [&_.swiper-slide]:h-auto"
          >
            {kpis.map((kpi) => (
              <SwiperSlide key={kpi.label} className="h-auto!">
                <StatCard {...kpi} loading={isLoading} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Desktop: grid */}
        <div className="hidden gap-3 lg:grid lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {kpis.map((kpi) => (
            <StatCard key={kpi.label} {...kpi} loading={isLoading} />
          ))}
        </div>
      </section>

      {/* ------------------------------ Charts ----------------------------- */}
      <section aria-label="نمودارها" className="min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <TrendingUp
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-foreground">تحلیل سریع</h2>
        </div>
        {isLoading || !data ? (
          <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <AdminDashboardCharts data={data} />
        )}
      </section>

      {/* ----------------------------- Sections ---------------------------- */}
      <section aria-label="بخش‌های مدیریت" className="min-w-0 space-y-3">
        <div className="flex items-center gap-2">
          <LayoutDashboard
            className="h-4 w-4 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="text-sm font-semibold text-foreground">
            بخش‌های مدیریت
          </h2>
        </div>

        {/* Mobile / tablet: swipeable section cards */}
        <div className="lg:hidden">
          <Swiper
            modules={[FreeMode]}
            freeMode
            spaceBetween={12}
            slidesPerView={1.1}
            breakpoints={{
              480: { slidesPerView: 1.4 },
              640: { slidesPerView: 2.1 },
              768: { slidesPerView: 2.6 },
            }}
            className="-mx-4 px-4 [&_.swiper-slide]:h-auto"
          >
            {sections.map((section) => (
              <SwiperSlide key={section.href} className="h-auto!">
                <SectionCard section={section} />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* Desktop: grid */}
        <div className="hidden gap-4 sm:grid-cols-2 lg:grid lg:grid-cols-4">
          {sections.map((section) => (
            <SectionCard key={section.href} section={section} />
          ))}
        </div>
      </section>
    </div>
  );
}
