"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
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
// بعداً از API بگیر (مثلاً وزن‌های ثبت‌شده کاربر)
const labels = [
  "۱ تیر",
  "۸ تیر",
  "۱۵ تیر",
  "۲۲ تیر",
  "۲۹ تیر",
  "۵ مرداد",
  "۱۲ مرداد",
];
const weights = [74.2, 73.8, 73.5, 73.1, 72.9, 72.6, 72.4];
// ==================================================

export function WeightChart() {
  const data: ChartData<"line"> = useMemo(
    () => ({
      labels,
      datasets: [
        {
          label: "وزن (کیلوگرم)",
          data: weights,
          borderColor: "oklch(0.73 0.19 45)", // primary نارنجی پروژه
          backgroundColor: "oklch(0.73 0.19 45 / 0.15)",
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: "oklch(0.73 0.19 45)",
        },
      ],
    }),
    [],
  );

  const options: ChartOptions<"line"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          titleFont: { family: "iran-sans" },
          bodyFont: { family: "iran-sans" },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { family: "iran-sans", size: 11 } },
        },
        y: {
          grid: { color: "oklch(0.9 0 0 / 0.3)" },
          ticks: { font: { family: "iran-sans", size: 11 } },
        },
      },
      interaction: {
        mode: "index",
        intersect: false,
      },
    }),
    [],
  );

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">روند وزن</CardTitle>
        <CardDescription>۷ هفته اخیر</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-55 sm:h-65">
          <Line data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
