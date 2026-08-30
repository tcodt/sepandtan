"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Play } from "lucide-react";
import { cn } from "@/lib/utils";

// ==================== MOCK DATA ====================
const todayExercises = [
  { id: 1, name: "اسکوات با دمبل", sets: "۳ × ۱۲", done: true },
  { id: 2, name: "پرس سینه", sets: "۴ × ۱۰", done: true },
  { id: 3, name: "ددلیفت رومانیایی", sets: "۳ × ۱۰", done: false },
  { id: 4, name: "پلانک", sets: "۳ × ۴۵ ثانیه", done: false },
];
// ==================================================

export function TodayPlan() {
  const completedCount = todayExercises.filter((e) => e.done).length;

  return (
    <Card className="border-border bg-muted/50 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base sm:text-lg">برنامه امروز</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            {completedCount} از {todayExercises.length} حرکت انجام شده
          </p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Play className="w-3.5 h-3.5" />
          شروع تمرین
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
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
      </CardContent>
    </Card>
  );
}
