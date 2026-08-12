"use client";

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import "@/lib/chart-setup";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ChartData, ChartOptions } from "chart.js";

// ==================== MOCK DATA ====================
const labels = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
];
const completed = [1, 0, 1, 1, 0, 1, 0]; // ۱ = انجام شده
// ==================================================

export function WorkoutChart() {
  const data: ChartData<"bar"> = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "تمرین انجام‌شده",
          data: completed,
          backgroundColor: completed.map((v) =>
            v === 1 ? "oklch(0.73 0.19 45)" : "oklch(0.7 0 0 / 0.2)",
          ),
          borderRadius: 8,
          barThickness: 28,
        },
      ],
    }),
    [],
  );

  const options: ChartOptions<"bar"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: {
            label: (ctx) => (ctx.raw === 1 ? "انجام شد" : "انجام نشد"),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "iran-sans", size: 11 } },
        },
        y: {
          display: false,
          max: 1.4,
        },
      },
    }),
    [],
  );

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">تمرین این هفته</CardTitle>
        <CardDescription>۴ از ۵ جلسه انجام شده</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-50 sm:h-55">
          <Bar data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
