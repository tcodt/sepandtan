"use client";

import Link from "next/link";
import { Apple, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ==================== MOCK ====================
const meals = [
  { name: "صبحانه", cal: 420, done: true },
  { name: "میان‌وعده", cal: 180, done: true },
  { name: "ناهار", cal: 550, done: false },
  { name: "شام", cal: 480, done: false },
];
const totalConsumed = 600;
const target = 2100;
// ==============================================

export function NutritionSummary() {
  return (
    <Card className="border-border bg-card/80 dark:bg-card/60 backdrop-blur-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Apple className="w-4 h-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">تغذیه امروز</CardTitle>
            <p className="text-xs text-muted-foreground">
              {totalConsumed.toLocaleString("fa-IR")} از{" "}
              {target.toLocaleString("fa-IR")} کالری
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {meals.map((meal) => (
          <div
            key={meal.name}
            className="flex items-center justify-between text-sm"
          >
            <span
              className={
                meal.done
                  ? "text-muted-foreground line-through"
                  : "text-foreground"
              }
            >
              {meal.name}
            </span>
            <span className="text-muted-foreground">{meal.cal} کالری</span>
          </div>
        ))}

        <Button
          asChild
          variant="outline"
          size="sm"
          className="w-full mt-2 gap-1"
        >
          <Link href="/nutrition">
            مشاهده رژیم کامل
            <ChevronLeft className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
