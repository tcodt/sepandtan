"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, Variants } from "framer-motion";
import { DashboardHeader } from "./dashboard-header";
import { StatsCards } from "./stats-cards";
import { QuickActions } from "./quick-actions";
import { TodayWorkoutCard } from "./today-workout-card";
import { GoalProgress } from "./goal-progress";
import { NutritionSummary } from "./nutrition-summary";
import { RecentActivity } from "./recent-activity";
import { WeightLogCard } from "./weight-log-card";
import { useDashboardLogs } from "@/hooks/use-dashboard-logs";
import { ActivePlanCard } from "./active-plan-card";
import { DailyStatusBar } from "./daily-status-bar";
import { useSeedStartWeight } from "@/hooks/use-seed-start-weight";

// بارگذاری lazy برای چارت‌ها با حالت‌های بارگذاری بهتر
const WeightChart = dynamic(
  () => import("./weight-chart").then((m) => m.WeightChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-2xl border border-border/50 bg-linear-to-br from-card/50 to-card/30 animate-pulse shadow-sm" />
    ),
  },
);

const WorkoutChart = dynamic(
  () => import("./workout-chart").then((m) => m.WorkoutChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-2xl border border-border/50 bg-linear-to-br from-card/50 to-card/30 animate-pulse shadow-sm" />
    ),
  },
);

const CaloriesChart = dynamic(
  () => import("./calories-chart").then((m) => m.CaloriesChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-2xl border border-border/50 bg-linear-to-br from-card/50 to-card/30 animate-pulse shadow-sm" />
    ),
  },
);

// انیمیشن‌های ورود با تایپ‌گذاری صحیح
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

export function DashboardShell() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const logs = useDashboardLogs(refreshKey);

  useSeedStartWeight(() => setRefreshKey((k) => k + 1));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  const onDataChanged = () => setRefreshKey((k) => k + 1);

  // نمایش اسکلت در حین بارگذاری برای جلوگیری از خطای هیدریشن
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
          <div className="h-12 w-48 bg-muted/30 rounded-lg animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-muted/30 animate-pulse"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 h-64 bg-muted/30 rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-32 bg-muted/30 rounded-2xl animate-pulse" />
              <div className="h-32 bg-muted/30 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-primary/5">
      <DashboardHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* نوار وضعیت روزانه */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <DailyStatusBar
            workouts={logs.workouts}
            nutritions={logs.nutritions}
          />
        </motion.div>

        {/* کارت‌های آمار */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <StatsCards
            weights={logs.weights}
            workouts={logs.workouts}
            isLoading={logs.isLoading}
          />
        </motion.div>

        {/* اقدامات سریع */}
        <motion.div variants={itemVariants} initial="hidden" animate="visible">
          <QuickActions />
        </motion.div>

        {/* بخش اصلی - تمرین امروز و اهداف */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <motion.div
            className="lg:col-span-2"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <TodayWorkoutCard />
          </motion.div>

          <motion.div
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <GoalProgress weights={logs.weights} isLoading={logs.isLoading} />
            </motion.div>
            <motion.div variants={itemVariants}>
              <ActivePlanCard />
            </motion.div>
            <motion.div id="weight" variants={itemVariants}>
              <WeightLogCard onLogged={onDataChanged} />
            </motion.div>
          </motion.div>
        </div>

        {/* بخش چارت‌ها - بدون باکس اضافی */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <motion.div
            className="lg:col-span-2"
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <WeightChart weights={logs.weights} isLoading={logs.isLoading} />
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <CaloriesChart />
          </motion.div>
        </div>

        {/* بخش پایین - فعالیت‌ها و تغذیه */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="lg:sticky lg:top-20">
              <WorkoutChart
                workouts={logs.workouts}
                isLoading={logs.isLoading}
              />
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="lg:sticky lg:top-20">
              <NutritionSummary />
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            <RecentActivity
              weights={logs.weights}
              workouts={logs.workouts}
              nutritions={logs.nutritions}
              isLoading={logs.isLoading}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
