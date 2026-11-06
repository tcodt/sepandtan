"use client";

import { useMemo } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import type { ChartOptions, TooltipItem } from "chart.js";
import "@/lib/chart-setup";
import type { AdminOverviewSnapshot } from "@/features/admin/overview-types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Labels                                                                     */
/* -------------------------------------------------------------------------- */

const ROLE_LABELS: Record<string, string> = {
  USER: "کاربر",
  COACH: "مربی",
  STORE: "فروشنده",
  ADMIN: "ادمین",
  SUPERADMIN: "سوپرادمین",
  AUTHOR: "نویسنده",
  other: "سایر",
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "فعال",
  SUSPENDED: "معلق",
  DELETED: "حذف‌شده",
  other: "سایر",
};

/* -------------------------------------------------------------------------- */
/* Palette                                                                    */
/* -------------------------------------------------------------------------- */

const ROLE_COLORS = [
  "rgba(56, 189, 248, 0.9)",
  "rgba(52, 211, 153, 0.9)",
  "rgba(167, 139, 250, 0.9)",
  "rgba(251, 113, 133, 0.9)",
  "rgba(251, 191, 36, 0.9)",
  "rgba(148, 163, 184, 0.85)",
  "rgba(100, 116, 139, 0.8)",
];

const STATUS_COLORS = [
  "rgba(52, 211, 153, 0.9)",
  "rgba(251, 191, 36, 0.9)",
  "rgba(148, 163, 184, 0.85)",
  "rgba(100, 116, 139, 0.8)",
];

function faNum(n: number) {
  return n.toLocaleString("fa-IR");
}

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

function doughnutOptions(): ChartOptions<"doughnut"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "62%",
    plugins: {
      legend: {
        position: "bottom",
        rtl: true,
        labels: {
          boxWidth: 10,
          boxHeight: 10,
          usePointStyle: true,
          pointStyle: "circle",
          padding: 14,
          font: { size: 11, family: "inherit" },
          color: "rgb(100, 116, 139)",
        },
      },
      title: { display: false },
      tooltip: {
        rtl: true,
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        titleFont: { size: 12, family: "inherit" },
        bodyFont: { size: 12, family: "inherit" },
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: TooltipItem<"doughnut">) => {
            const value = Number(ctx.raw ?? 0);
            const data = ctx.dataset.data as number[];
            const sum = data.reduce((a, b) => a + Number(b), 0) || 1;
            const pct = Math.round((value / sum) * 100);
            return ` ${ctx.label}: ${faNum(value)} (${faNum(pct)}٪)`;
          },
        },
      },
    },
  };
}

function barOptions(): ChartOptions<"bar"> {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        rtl: true,
        backgroundColor: "rgba(15, 23, 42, 0.92)",
        titleFont: { size: 12, family: "inherit" },
        bodyFont: { size: 12, family: "inherit" },
        padding: 10,
        cornerRadius: 10,
        callbacks: {
          label: (ctx: TooltipItem<"bar">) => ` ${faNum(Number(ctx.raw ?? 0))}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, family: "inherit" },
          color: "rgb(100, 116, 139)",
        },
        border: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          font: { size: 11, family: "inherit" },
          color: "rgb(100, 116, 139)",
          callback: (v) => faNum(Number(v)),
        },
        grid: { color: "rgba(148, 163, 184, 0.12)" },
        border: { display: false },
      },
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Shell                                                                      */
/* -------------------------------------------------------------------------- */

function ChartShell({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden border-border", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-tight">
          {title}
        </CardTitle>
        {subtitle ? (
          <p className="line-clamp-1 text-[11px] text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="h-64 p-4 pt-0 sm:h-72">{children}</CardContent>
    </Card>
  );
}

function EmptyChart({
  message = "داده‌ای برای نمایش نیست",
}: {
  message?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
      <span className="tabular-nums opacity-60">—</span>
      <span>{message}</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

type Props = {
  data: AdminOverviewSnapshot;
};

export function AdminDashboardCharts({ data }: Props) {
  const roleEntries = useMemo(
    () => Object.entries(data.roleBreakdown).filter(([, v]) => v > 0),
    [data.roleBreakdown],
  );

  const statusEntries = useMemo(
    () => Object.entries(data.statusBreakdown).filter(([, v]) => v > 0),
    [data.statusBreakdown],
  );

  const roleChart = useMemo(
    () => ({
      labels: roleEntries.map(([k]) => ROLE_LABELS[k] ?? k),
      datasets: [
        {
          data: roleEntries.map(([, v]) => v),
          backgroundColor: ROLE_COLORS.slice(0, roleEntries.length),
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }),
    [roleEntries],
  );

  const statusChart = useMemo(
    () => ({
      labels: statusEntries.map(([k]) => STATUS_LABELS[k] ?? k),
      datasets: [
        {
          data: statusEntries.map(([, v]) => v),
          backgroundColor: STATUS_COLORS.slice(0, statusEntries.length),
          borderWidth: 0,
          hoverOffset: 6,
        },
      ],
    }),
    [statusEntries],
  );

  const productBar = useMemo(
    () => ({
      labels: ["در انتظار", "تأییدشده", "ویژه"],
      datasets: [
        {
          label: "محصولات",
          data: [
            data.products.PENDING,
            data.products.APPROVED,
            data.products.featured,
          ],
          backgroundColor: [
            "rgba(251, 191, 36, 0.9)",
            "rgba(52, 211, 153, 0.9)",
            "rgba(167, 139, 250, 0.9)",
          ],
          borderRadius: 10,
          maxBarThickness: 56,
          borderSkipped: false as const,
        },
      ],
    }),
    [data.products],
  );

  const supportBar = useMemo(
    () => ({
      labels: ["تیکت کل", "تیکت باز", "گزارش کل", "گزارش باز"],
      datasets: [
        {
          label: "پشتیبانی",
          data: [
            data.tickets.total,
            data.tickets.pending + data.tickets.open,
            data.reports.total,
            data.reports.pending,
          ],
          backgroundColor: [
            "rgba(56, 189, 248, 0.9)",
            "rgba(251, 113, 133, 0.85)",
            "rgba(167, 139, 250, 0.9)",
            "rgba(251, 191, 36, 0.9)",
          ],
          borderRadius: 10,
          maxBarThickness: 56,
          borderSkipped: false as const,
        },
      ],
    }),
    [data.tickets, data.reports],
  );

  const roleTotal = roleEntries.reduce((s, [, v]) => s + v, 0);
  const statusTotal = statusEntries.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ChartShell
        title="توزیع نقش کاربران"
        subtitle={
          roleTotal > 0
            ? `بر اساس ${faNum(roleTotal)} کاربر در نمونهٔ لیست`
            : undefined
        }
      >
        {roleEntries.length === 0 ? (
          <EmptyChart />
        ) : (
          <Doughnut data={roleChart} options={doughnutOptions()} />
        )}
      </ChartShell>

      <ChartShell
        title="وضعیت حساب‌ها"
        subtitle={
          statusTotal > 0
            ? `بر اساس ${faNum(statusTotal)} کاربر در نمونهٔ لیست`
            : undefined
        }
      >
        {statusEntries.length === 0 ? (
          <EmptyChart />
        ) : (
          <Doughnut data={statusChart} options={doughnutOptions()} />
        )}
      </ChartShell>

      <ChartShell
        title="محصولات فروشگاه"
        subtitle={`در انتظار ${faNum(data.products.PENDING)} · تأیید ${faNum(data.products.APPROVED)} · ویژه ${faNum(data.products.featured)}`}
      >
        <Bar data={productBar} options={barOptions()} />
      </ChartShell>

      <ChartShell
        title="پشتیبانی و گزارش‌ها"
        subtitle={`تیکت ${faNum(data.tickets.total)} · گزارش ${faNum(data.reports.total)}`}
      >
        <Bar data={supportBar} options={barOptions()} />
      </ChartShell>
    </div>
  );
}
