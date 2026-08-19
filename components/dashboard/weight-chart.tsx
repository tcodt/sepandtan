"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  type ChartOptions,
  type ScriptableContext,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUp,
  ArrowDown,
  Weight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserStore } from "@/lib/store/user-store";
import { getWeightLogs } from "@/lib/api/logs";
import type { WeightLog } from "@/lib/types/plan";
import { useTheme } from "next-themes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

type Props = {
  /** برای اجبار به رفرش بعد از ثبت وزن */
  refreshKey?: number;
};

export function WeightChart({ refreshKey = 0 }: Props) {
  const user = useUserStore((s) => s.user);
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(false);
  const { theme, systemTheme } = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  const isDark =
    theme === "dark" || (theme === "system" && systemTheme === "dark");

  useEffect(() => {
    if (!user?.id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLogs([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getWeightLogs(user.id)
      .then((data) => {
        if (cancelled) return;

        const sorted = [...(data || [])].sort((a, b) =>
          a.date.localeCompare(b.date),
        );

        // آخرین وزن هر روز
        const byDate = new Map<string, WeightLog>();
        sorted.forEach((log) => {
          byDate.set(log.date, log);
        });

        setLogs(Array.from(byDate.values()));
      })
      .catch((err) => {
        console.error("weight chart failed", err);
        if (!cancelled) setLogs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, refreshKey]);

  const values = logs.map((l) => Number(l.weight));
  const labels = logs.map((l) => {
    // 2026-08-17 → 08/17
    const parts = l.date.split("-");
    return parts.length === 3 ? `${parts[1]}/${parts[2]}` : l.date;
  });

  const yMin = values.length ? Math.floor(Math.min(...values) - 1) : undefined;
  const yMax = values.length ? Math.ceil(Math.max(...values) + 1) : undefined;

  // Colors based on theme
  const borderColor = isDark ? "rgb(251, 146, 60)" : "rgb(249, 115, 22)";
  const backgroundColor = isDark
    ? "rgba(251, 146, 60, 0.2)"
    : "rgba(249, 115, 22, 0.15)";
  const pointBackgroundColor = isDark
    ? "rgb(251, 146, 60)"
    : "rgb(249, 115, 22)";
  const gridColor = isDark
    ? "rgba(255, 255, 255, 0.08)"
    : "rgba(120, 120, 120, 0.15)";
  const tickColor = isDark
    ? "rgba(255, 255, 255, 0.7)"
    : "hsl(var(--muted-foreground))";

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "وزن",
          data: values,
          borderColor,
          backgroundColor,
          fill: true,
          tension: 0.4,
          pointRadius: (ctx: ScriptableContext<"line">) => {
            const index = ctx.dataIndex;
            return hoveredPoint === index ? 8 : 5;
          },
          pointHoverRadius: 10,
          pointBackgroundColor,
          pointBorderColor: isDark ? "#1a1a1a" : "#fff",
          pointBorderWidth: 2,
          borderWidth: 3,
          pointHoverBackgroundColor: isDark ? "#fb923c" : "#f97316",
          pointHoverBorderColor: isDark ? "#fff" : "#fff",
          pointHoverBorderWidth: 3,
        },
      ],
    }),
    [
      labels,
      values,
      borderColor,
      backgroundColor,
      pointBackgroundColor,
      hoveredPoint,
      isDark,
    ],
  );

  const options = useMemo(
    (): ChartOptions<"line"> => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 600,
        easing: "easeInOutQuart",
      },
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          backgroundColor: isDark
            ? "rgba(30, 30, 30, 0.95)"
            : "rgba(255, 255, 255, 0.95)",
          titleColor: isDark ? "#fff" : "#000",
          bodyColor: isDark ? "#e5e5e5" : "#333",
          borderColor: isDark
            ? "rgba(255, 255, 255, 0.1)"
            : "rgba(0, 0, 0, 0.1)",
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          titleFont: {
            weight: "bold",
            size: 13,
          },
          bodyFont: {
            size: 12,
          },
          callbacks: {
            label: (ctx) => {
              if (ctx.parsed.y == null) return "";
              const value = ctx.parsed.y.toLocaleString("fa-IR");
              const date = ctx.label;
              return [`وزن: ${value} کیلو`, `تاریخ: ${date}`];
            },
            afterLabel: (ctx) => {
              const index = ctx.dataIndex;
              if (index === 0) return "اولین ثبت";
              if (index === values.length - 1) return "آخرین ثبت";
              return "";
            },
          },
        },
      },
      scales: {
        x: {
          offset: true,
          grid: { display: false },
          ticks: {
            color: tickColor,
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
            font: {
              size: 11,
            },
          },
        },
        y: {
          min: yMin,
          max: yMax,
          grid: {
            color: gridColor,
            drawTicks: false,
          },
          ticks: {
            color: tickColor,
            callback: (value: string | number) =>
              `${Number(value).toLocaleString("fa-IR")}`,
            font: {
              size: 11,
            },
            stepSize: values.length > 5 ? 1 : 0.5,
          },
        },
      },
      onHover: (event, chartElements) => {
        if (chartElements && chartElements.length > 0) {
          const index = chartElements[0].index;
          setHoveredPoint(index);
        } else {
          setHoveredPoint(null);
        }
      },
    }),
    [yMin, yMax, gridColor, tickColor, values.length, isDark],
  );

  const latest = values.length ? values[values.length - 1] : null;
  const first = values.length ? values[0] : null;
  const diff =
    latest != null && first != null
      ? Number((latest - first).toFixed(1))
      : null;

  // Calculate trend
  const trend =
    values.length > 1
      ? diff && diff > 0
        ? "صعودی"
        : diff && diff < 0
          ? "نزولی"
          : "ثابت"
      : null;

  const trendIcon =
    trend === "صعودی" ? (
      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
    ) : trend === "نزولی" ? (
      <TrendingDown className="w-4 h-4 text-red-500 dark:text-red-400" />
    ) : trend === "ثابت" ? (
      <Minus className="w-4 h-4 text-muted-foreground" />
    ) : null;

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base">روند وزن</CardTitle>
            {trend && trendIcon && (
              <span className="flex items-center gap-1 text-sm font-medium text-muted-foreground">
                {trendIcon}
                {trend}
              </span>
            )}
          </div>
          {latest != null && (
            <div className="text-left">
              <p className="text-sm font-semibold text-foreground flex items-center gap-1">
                <Weight className="w-4 h-4" />
                {latest.toLocaleString("fa-IR")} کیلو
              </p>
              {diff != null && (
                <p
                  className={`text-xs font-medium flex items-center gap-1 justify-end ${
                    diff < 0
                      ? "text-green-600 dark:text-green-400"
                      : diff > 0
                        ? "text-red-500 dark:text-red-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {diff > 0 ? (
                    <ArrowUp className="w-3 h-3" />
                  ) : diff < 0 ? (
                    <ArrowDown className="w-3 h-3" />
                  ) : null}
                  {diff !== 0 ? diff.toLocaleString("fa-IR") : "۰"}
                  {diff !== 0 ? " کیلو" : ""}
                  {diff !== 0 && " از ابتدا"}
                </p>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-10 text-center">
            هنوز وزنی ثبت نشده است.
          </p>
        ) : logs.length === 1 ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2">
            <p className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Weight className="w-6 h-6" />
              {latest?.toLocaleString("fa-IR")} کیلو
            </p>
            <p className="text-xs text-muted-foreground">
              برای رسم نمودار، حداقل ۲ ثبت وزن لازم است.
            </p>
          </div>
        ) : (
          <div className="h-64 w-full">
            <Line
              data={chartData}
              options={options}
              className="transition-all duration-300"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
