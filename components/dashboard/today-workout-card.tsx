"use client";

import Link from "next/link";
import { Play, CheckCircle2, Circle, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

// ==================== MOCK DATA ====================
const todayExercises = [
  { id: 1, name: "اسکوات با وزن بدن", sets: "۳ × ۱۲", done: true },
  { id: 2, name: "شنا سوئدی", sets: "۳ × ۱۰", done: true },
  { id: 3, name: "ددلیفت رومانیایی", sets: "۳ × ۱۰", done: false },
  { id: 4, name: "پلانک", sets: "۳ × ۴۵ث", done: false },
  { id: 5, name: "لانگز معکوس", sets: "۳ × ۱۰", done: false },
];
// ==================================================

export function TodayWorkoutCard() {
  const completed = todayExercises.filter((e) => e.done).length;
  const total = todayExercises.length;
  const progress = (completed / total) * 100;
  const allDone = completed === total;

  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base sm:text-lg">برنامه امروز</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {completed} از {total} حرکت انجام شده
          </p>
        </div>

        <Button asChild size="sm" className="gap-1.5 shrink-0">
          <Link href="/workout/today">
            {allDone ? (
              <>
                مشاهده
                <ChevronLeft className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                ادامه تمرین
              </>
            )}
          </Link>
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />

        <div className="space-y-2">
          {todayExercises.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-colors",
                item.done
                  ? "border-primary/30 bg-primary/5"
                  : "border-border bg-background",
              )}
            >
              {item.done ? (
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-medium truncate",
                    item.done ? "text-primary" : "text-foreground",
                  )}
                >
                  {item.name}
                </p>
                <p className="text-xs text-muted-foreground">{item.sets}</p>
              </div>
            </div>
          ))}
        </div>

        <Button asChild variant="outline" className="w-full gap-2">
          <Link href="/workout/today">
            {allDone ? "مرور تمرین امروز" : "شروع / ادامه تمرین"}
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
