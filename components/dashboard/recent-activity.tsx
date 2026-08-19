"use client";

import { useEffect, useMemo, useState } from "react";
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
import { useUserStore } from "@/lib/store/user-store";
import {
  getWeightLogs,
  getWorkoutLogs,
  getNutritionLogs,
} from "@/lib/api/logs";
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

export function RecentActivity() {
  const user = useUserStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [workouts, setWorkouts] = useState<WorkoutLog[]>([]);
  const [nutritions, setNutritions] = useState<NutritionLog[]>([]);

  useEffect(() => {
    if (!user?.id) return;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      getWeightLogs(user.id),
      getWorkoutLogs(user.id),
      getNutritionLogs(user.id),
    ])
      .then(([w, wo, n]) => {
        setWeights(w || []);
        setWorkouts(wo || []);
        setNutritions(n || []);
      })
      .catch((err) => {
        console.error("recent activity failed", err);
      })
      .finally(() => setLoading(false));
  }, [user?.id]);

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

  const displayItems = useMemo(() => {
    return showAll ? allItems : allItems.slice(0, INITIAL_DISPLAY_COUNT);
  }, [allItems, showAll]);

  const iconFor = (type: ActivityItem["type"]) => {
    if (type === "weight") return Scale;
    if (type === "workout") return Dumbbell;
    return Apple;
  };

  const hasMore = allItems.length > INITIAL_DISPLAY_COUNT;

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <CardTitle className="text-base">فعالیت‌های اخیر</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : allItems.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            هنوز فعالیتی ثبت نشده. تمرین، رژیم یا وزن را ثبت کن.
          </p>
        ) : (
          <>
            <div className="flex-1 space-y-3 overflow-y-auto min-h-0">
              {displayItems.map((item) => {
                const Icon = iconFor(item.type);
                return (
                  <div
                    key={item.id}
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
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <div className="mt-3 pt-3 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setShowAll(!showAll)}
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5 ml-1.5" />
                      نمایش کمتر
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5 ml-1.5" />
                      نمایش بیشتر ({allItems.length -
                        INITIAL_DISPLAY_COUNT}{" "}
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
