"use client";

import { useMemo, useState } from "react";
import { Dumbbell, Heart, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Category from "../../../components/workout/category";
import { exercises } from "@/lib/data/exercises";
import { ExerciseCard } from "@/components/workout/exercise-card";

const categories = [
  { id: "all", name: "همه", icon: Sparkles },
  { id: "strength", name: "قدرتی", icon: Dumbbell },
  { id: "cardio", name: "هوازی", icon: Heart },
  { id: "mobility", name: "تحرکی", icon: Zap },
  { id: "yoga", name: "یوگا", icon: Zap },
];

export default function WorkoutsPage() {
  const [selected, setSelected] = useState("all");

  const filtered = useMemo(() => {
    if (selected === "all") return exercises;
    return exercises.filter((e) => e.category === selected);
  }, [selected]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-16 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              کتابخانه حرکات
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {exercises.length} حرکت با آموزش و عضلات درگیر
            </p>
          </div>
          <Button asChild className="rounded-full gap-2 shrink-0">
            <Link href="/workout/today">
              <Sparkles className="w-4 h-4" />
              برنامه امروز
            </Link>
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Intro */}
        <div className="rounded-2xl border border-border bg-card/80 dark:bg-card/60 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">آموزش حرکات</p>
              <h2 className="text-lg sm:text-xl font-bold text-foreground">
                انتخاب حرکت مناسب
              </h2>
            </div>
            <Badge variant="secondary" className="rounded-full">
              گیف + توضیح + عضلات
            </Badge>
          </div>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
            هر حرکت شامل توضیح متنی، عضلات درگیر و امکان اضافه کردن به برنامه
            شماست. روی کارت کلیک کنید تا جزئیات کامل را ببینید.
          </p>
        </div>

        {/* Categories */}
        <Category
          categories={categories}
          selected={selected}
          filteredWorkouts={filtered.length}
          onCategoryChange={setSelected}
        />

        {/* Grid */}
        <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            حرکتی در این دسته پیدا نشد.
          </div>
        )}
      </div>
    </div>
  );
}
