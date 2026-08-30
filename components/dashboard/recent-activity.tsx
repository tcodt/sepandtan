"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Apple,
  Loader2,
  Scale,
  Dumbbell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/empty-state";
import type { WeightLog, WorkoutLog, NutritionLog } from "@/lib/types/plan";

type ActivityItem = {
  id: string;
  type: "weight" | "workout" | "nutrition";
  title: string;
  subtitle: string;
  date: string;
  sortKey: string;
};

const INITIAL_DISPLAY_COUNT = 4;

type Props = {
  weights?: WeightLog[];
  workouts?: WorkoutLog[];
  nutritions?: NutritionLog[];
  isLoading?: boolean;
};

export function RecentActivity({
  weights = [],
  workouts = [],
  nutritions = [],
  isLoading = false,
}: Props) {
  const [showAll, setShowAll] = useState(false);

  const allItems = useMemo(() => {
    const list: ActivityItem[] = [];

    weights.forEach((log) => {
      list.push({
        id: `w-${log.id}`,
        type: "weight",
        title: `ثبت وزن ${log.weight.toLocaleString("fa-IR")} کیلو`,
        subtitle: log.note || "پیگیری وزن",
        date: log.date,
        sortKey: `${log.date}-weight-${log.id}`,
      });
    });

    workouts.forEach((log) => {
      const done = log.exercises?.filter((e) => e.completed).length || 0;
      const total = log.exercises?.length || 0;
      list.push({
        id: `wo-${log.id}`,
        type: "workout",
        title: `تمرین روز ${log.dayNumber}`,
        subtitle: `${done.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} حرکت انجام شد`,
        date: log.date,
        sortKey: `${log.date}-workout-${log.id}`,
      });
    });

    nutritions.forEach((log) => {
      const eaten = log.meals?.filter((m) => m.status === "eaten").length || 0;
      const total = log.meals?.length || 0;
      list.push({
        id: `n-${log.id}`,
        type: "nutrition",
        title: "ثبت رژیم روزانه",
        subtitle: `${eaten.toLocaleString("fa-IR")} از ${total.toLocaleString("fa-IR")} وعده`,
        date: log.date,
        sortKey: `${log.date}-nutrition-${log.id}`,
      });
    });

    return list.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
  }, [weights, workouts, nutritions]);

  const displayItems = showAll
    ? allItems
    : allItems.slice(0, INITIAL_DISPLAY_COUNT);

  const hasMore = allItems.length > INITIAL_DISPLAY_COUNT;

  const iconFor = (type: ActivityItem["type"]) => {
    if (type === "weight") return Scale;
    if (type === "workout") return Dumbbell;
    return Apple;
  };

  return (
    <Card className="border-border bg-muted/50 backdrop-blur-sm h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-base">فعالیت‌های اخیر</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : allItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <EmptyState
              icon={<Activity className="w-5 h-5" />}
              title="هنوز فعالیتی نداری"
              description="با اولین تمرین، ثبت وزن یا رژیم، پیشرفت از اینجا شروع می‌شود."
              actionLabel="شروع تمرین امروز"
              actionHref="/workout/today"
              className="py-6"
            />
          </motion.div>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
              <AnimatePresence initial={false}>
                {displayItems.map((item, index) => {
                  const Icon = iconFor(item.type);
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                      className="flex items-start gap-3 rounded-xl border border-border bg-background p-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                      <span className="text-[11px] text-muted-foreground shrink-0">
                        {item.date}
                      </span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="mt-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAll((v) => !v)}
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 ml-1.5" />
                      نمایش کمتر
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                      نمایش بیشتر (
                      {(allItems.length - INITIAL_DISPLAY_COUNT).toLocaleString(
                        "fa-IR",
                      )}{" "}
                      مورد دیگر)
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
