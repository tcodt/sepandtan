"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
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
const consumed = 1840;
const remaining = 260;
const target = 2100;
// ==================================================

export function CaloriesChart() {
  const data: ChartData<"doughnut"> = useMemo(
    () => ({
      labels: ["مصرف‌شده", "باقی‌مانده"],
      datasets: [
        {
          data: [consumed, remaining],
          backgroundColor: ["oklch(0.73 0.19 45)", "oklch(0.7 0 0 / 0.15)"],
          borderWidth: 0,
          cutout: "72%",
        },
      ],
    }),
    [],
  );

  const options: ChartOptions<"doughnut"> = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          rtl: true,
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw} کالری`,
          },
        },
      },
    }),
    [],
  );

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">کالری امروز</CardTitle>
        <CardDescription>
          هدف روزانه {target.toLocaleString("fa-IR")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-45 sm:h-50">
          <Doughnut data={data} options={options} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold text-foreground">
              {consumed.toLocaleString("fa-IR")}
            </span>
            <span className="text-xs text-muted-foreground">کالری</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
