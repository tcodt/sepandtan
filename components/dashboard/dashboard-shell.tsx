"use client";

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

export function DashboardShell() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* خوش‌آمد + آمار کلی */}
        <StatsCards />

        {/* دسترسی سریع به همه بخش‌ها */}
        <QuickActions />

        {/* ردیف اصلی: تمرین امروز + هدف */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <TodayWorkoutCard />
          </div>
          <div>
            <GoalProgress />
          </div>
        </div>

        {/* نمودارها */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <WeightChart />
          </div>
          <div>
            <CaloriesChart />
          </div>
        </div>

        {/* تمرین هفته + تغذیه + فعالیت */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <WorkoutChart />
          <NutritionSummary />
          <RecentActivity />
        </div>
      </main>
    </div>
  );
}
