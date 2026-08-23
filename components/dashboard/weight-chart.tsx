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
  type TooltipItem,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Loader2, TrendingUp, TrendingDown, Minus, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/common/empty-state";
import type { WeightLog } from "@/lib/types/plan";
import { useTheme } from "next-themes";

const FONT_FAMILY =
  "IRANSans, 'IRANSansWeb', 'Vazirmatn', 'Tahoma', 'Arial', sans-serif";

ChartJS.defaults.font.family = FONT_FAMILY;
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
);

type Props = {
  weights?: WeightLog[];
  isLoading?: boolean;
};

function parseLocalDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0, 0);
}

function formatFaDayLabel(dateStr: string) {
  const date = parseLocalDate(dateStr);
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

export function WeightChart({ weights = [], isLoading = false }: Props) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isDark = mounted
    ? theme === "dark" || (theme === "system" && systemTheme === "dark")
    : false;

  const logs = useMemo(() => {
    const sorted = [...weights].sort((a, b) => a.date.localeCompare(b.date));
    const byDate = new Map<string, WeightLog>();
    sorted.forEach((log) => {
      byDate.set(log.date, {
        ...log,
        weight: Number(log.weight),
      });
    });
    return Array.from(byDate.values());
  }, [weights]);

  const values = logs.map((l) => Number(l.weight));
  const labels = logs.map((l) => formatFaDayLabel(l.date));

  const yMin = values.length ? Math.floor(Math.min(...values) - 1) : undefined;
  const yMax = values.length ? Math.ceil(Math.max(...values) + 1) : undefined;

  const borderColor = isDark ? "rgb(251, 146, 60)" : "rgb(249, 115, 22)";
  const backgroundColor = isDark
    ? "rgba(251, 146, 60, 0.15)"
    : "rgba(249, 115, 22, 0.12)";

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
          tension: values.length > 1 ? 0.35 : 0,
          pointRadius: values.length === 1 ? 6 : 4,
          pointHoverRadius: 7,
          pointBackgroundColor: borderColor,
          pointBorderColor: isDark ? "#1a1a1a" : "#fff",
          pointBorderWidth: 2,
          borderWidth: 3,
        },
      ],
    }),
    [labels, values, borderColor, backgroundColor, isDark],
  );

  const options = useMemo<ChartOptions<"line">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: {
            title: (items: TooltipItem<"line">[]) => items?.[0]?.label ?? "",
            label: (ctx: TooltipItem<"line">) => {
              if (ctx.parsed.y == null) return "";
              return `وزن: ${Number(ctx.parsed.y).toLocaleString("fa-IR")} کیلو`;
            },
          },
        },
      },
      scales: {
        x: {
          offset: true,
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 8,
          },
        },
        y: {
          min: yMin,
          max: yMax,
          ticks: {
            callback: (value) => `${Number(value).toLocaleString("fa-IR")}`,
          },
        },
      },
    }),
    [yMin, yMax],
  );

  const latest = values.length ? values[values.length - 1] : null;
  const first = values.length ? values[0] : null;
  const diff =
    latest != null && first != null
      ? Number((latest - first).toFixed(1))
      : null;

  return (
    <Card className="border-border/50 bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scale className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                روند وزن
              </CardTitle>
              {diff != null && values.length > 1 && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  {diff < 0 ? (
                    <TrendingDown className="w-3.5 h-3.5 text-green-500" />
                  ) : diff > 0 ? (
                    <TrendingUp className="w-3.5 h-3.5 text-red-500" />
                  ) : (
                    <Minus className="w-3.5 h-3.5" />
                  )}
                  {diff > 0 ? "+" : ""}
                  {diff.toLocaleString("fa-IR")} کیلو از ابتدا
                </p>
              )}
            </div>
          </div>

          {latest != null && (
            <div className="text-left">
              <p className="text-xs text-muted-foreground">وزن فعلی</p>
              <p className="text-sm font-bold">
                {latest.toLocaleString("fa-IR")} کیلو
              </p>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
          </div>
        ) : logs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <EmptyState
              icon={<Scale className="w-5 h-5" />}
              title="هنوز وزنی ثبت نشده"
              description="اولین وزن را ثبت کن تا روند پیشرفتت رسم شود."
              actionLabel="ثبت وزن"
              actionHref="/dashboard#weight"
              className="py-8"
            />
          </motion.div>
        ) : (
          <div className="h-64 w-full">
            <Line data={chartData} options={options} />
            {logs.length === 1 && (
              <p className="text-[11px] text-muted-foreground text-center mt-2">
                با ثبت وزن بعدی، روند واضح‌تر می‌شود.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
