"use client";

import { useState } from "react";
import { DashboardHeader } from "./dashboard-header";
import { StatsCards } from "./stats-cards";
import { QuickActions } from "./quick-actions";
import { TodayWorkoutCard } from "./today-workout-card";
import { WeightChart } from "./weight-chart";
import { WorkoutChart } from "./workout-chart";
import { CaloriesChart } from "./calories-chart";
import { GoalProgress } from "./goal-progress";
import { NutritionSummary } from "./nutrition-summary";
import { RecentActivity } from "./recent-activity";
import { WeightLogCard } from "./weight-log-card";

export function DashboardShell() {
  // برای مجبور کردن رفرش آمار بعد از ثبت وزن
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <StatsCards key={`stats-${refreshKey}`} />

        <QuickActions />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <TodayWorkoutCard />
          </div>
          <div className="space-y-4">
            <GoalProgress key={`goal-${refreshKey}`} />
            <WeightLogCard onLogged={() => setRefreshKey((k) => k + 1)} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <WeightChart key={`wchart-${refreshKey}`} />
          </div>
          <div>
            <CaloriesChart />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 items-start">
          <div className="lg:sticky lg:top-20">
            <WorkoutChart />
          </div>
          <div className="lg:sticky lg:top-20">
            <NutritionSummary />
          </div>
          <div>
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  );
}
