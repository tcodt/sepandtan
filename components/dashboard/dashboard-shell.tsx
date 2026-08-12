"use client";

import { DashboardHeader } from "./dashboard-header";
import { StatsCards } from "./stats-cards";
import { WeightChart } from "./weight-chart";
import { WorkoutChart } from "./workout-chart";
import { CaloriesChart } from "./calories-chart";
import { TodayPlan } from "./today-plan";

export function DashboardShell() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Stats */}
        <StatsCards />

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2">
            <WeightChart />
          </div>
          <div>
            <CaloriesChart />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <WorkoutChart />
          <TodayPlan />
        </div>
      </main>
    </div>
  );
}
