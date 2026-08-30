"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type TooltipItem,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  Loader2,
  Dumbbell,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WorkoutLog } from "@/lib/types/plan";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

type Props = {
  workouts?: WorkoutLog[];
  isLoading?: boolean;
};

function toLocalDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatFaDayLabel(date: Date) {
  return new Intl.DateTimeFormat("fa-IR", {
    month: "short",
    day: "numeric",
  }).format(date);
}

/** ۷ روز منتهی به امروز، با offset هفته */
function getWeekDays(weekOffset = 0) {
  const days: { key: string; label: string; date: Date }[] = [];
  const end = new Date();
  end.setHours(12, 0, 0, 0); // جلوگیری از مشکل DST
  end.setDate(end.getDate() - weekOffset * 7);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    days.push({
      key: toLocalDateKey(d),
      label: formatFaDayLabel(d),
      date: d,
    });
  }
  return days;
}

function getWeekRangeLabel(weekOffset = 0) {
  const days = getWeekDays(weekOffset);
  const start = days[0]?.date;
  const end = days[6]?.date;
  if (!start || !end) return "";
  return `${formatFaDayLabel(start)} - ${formatFaDayLabel(end)}`;
}

export function WorkoutChart({ workouts = [], isLoading = false }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    };
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  const days = useMemo(() => getWeekDays(weekOffset), [weekOffset]);

  const values = useMemo(() => {
    return days.map((day) => {
      const logs = workouts.filter((w) => w.date === day.key);
      if (!logs.length) return 0;

      const last = logs[logs.length - 1];
      const total = last.exercises?.length || 0;
      if (!total) return 0;

      const done = last.exercises.filter((e) => e.completed).length;
      return Math.round((done / total) * 100);
    });
  }, [days, workouts]);

  const chartColors = useMemo(
    () => ({
      backgroundColor: isDarkMode
        ? "rgba(251, 146, 60, 0.85)"
        : "rgba(249, 115, 22, 0.8)",
      hoverBackgroundColor: isDarkMode
        ? "rgba(251, 146, 60, 0.95)"
        : "rgba(249, 115, 22, 0.95)",
      gridColor: isDarkMode
        ? "rgba(255, 255, 255, 0.06)"
        : "rgba(0, 0, 0, 0.06)",
      tickColor: isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.5)",
    }),
    [isDarkMode],
  );

  const chartData = useMemo(
    () => ({
      labels: days.map((d) => d.label),
      datasets: [
        {
          label: "درصد تکمیل تمرین",
          data: values,
          backgroundColor: values.map((v) =>
            v === 0 ? "rgba(200, 200, 200, 0.25)" : chartColors.backgroundColor,
          ),
          borderRadius: 6,
          maxBarThickness: 32,
          hoverBackgroundColor: chartColors.hoverBackgroundColor,
        },
      ],
    }),
    [days, values, chartColors],
  );

  const options = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: {
            title: (items: TooltipItem<"bar">[]) => items[0]?.label || "",
            label: (ctx: TooltipItem<"bar">) => {
              const value = Number(ctx.parsed.y);
              if (value === 0) return "بدون تمرین";
              return `${value.toLocaleString("fa-IR")}٪ تکمیل`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            maxRotation: 0,
            color: chartColors.tickColor,
          },
        },
        y: {
          min: 0,
          max: 100,
          ticks: {
            stepSize: 25,
            color: chartColors.tickColor,
            callback: (value) => `${Number(value).toLocaleString("fa-IR")}٪`,
          },
          grid: {
            color: chartColors.gridColor,
          },
        },
      },
    }),
    [chartColors],
  );

  const sessionsThisWeek = useMemo(() => {
    return workouts.filter((w) => days.some((d) => d.key === w.date)).length;
  }, [workouts, days]);

  const averageCompletion = useMemo(() => {
    const valid = values.filter((v) => v > 0);
    if (!valid.length) return 0;
    return Math.round(valid.reduce((a, b) => a + b, 0) / valid.length);
  }, [values]);

  return (
    <Card className="border-border/50 bg-muted/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                تمرین ۷ روز اخیر
              </CardTitle>
              {workouts.length > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  میانگین: {averageCompletion.toLocaleString("fa-IR")}٪
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-full">
            <TrendingUp className="w-3.5 h-3.5 text-primary/70" />
            <p className="text-xs font-medium text-primary/80">
              {sessionsThisWeek.toLocaleString("fa-IR")} جلسه
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              onClick={() => setWeekOffset((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 rounded-full"
              onClick={() => setWeekOffset((p) => Math.max(0, p - 1))}
              disabled={weekOffset === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <p className="text-xs text-muted-foreground font-medium">
            {getWeekRangeLabel(weekOffset)}
          </p>

          {weekOffset > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs"
              onClick={() => setWeekOffset(0)}
            >
              امروز
            </Button>
          ) : (
            <span className="w-10" />
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="h-56 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary/60" />
          </div>
        ) : (
          <div className="h-56 w-full">
            <Bar data={chartData} options={options} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
