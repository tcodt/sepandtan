"use client";

import { useState } from "react";
import { Plus, Moon, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PlanDay, PlanExercise, PlanMeal } from "@/lib/types/plan";
import { ExerciseList } from "./exercise-list";
import { MealEditor } from "./meal-editor";
import { AddExerciseSheet } from "./add-exercise-sheet";

type Props = {
  day: PlanDay;
  onChange: (patch: Partial<PlanDay>) => void;
};

export function DayEditor({ day, onChange }: Props) {
  const [showAddExercise, setShowAddExercise] = useState(false);

  const handleAddExercise = (exercise: PlanExercise) => {
    onChange({
      exercises: [...day.exercises, exercise],
      isRestDay: false,
    });
    setShowAddExercise(false);
  };

  const handleUpdateExercise = (index: number, updated: PlanExercise) => {
    const next = [...day.exercises];
    next[index] = updated;
    onChange({ exercises: next });
  };

  const handleRemoveExercise = (index: number) => {
    onChange({
      exercises: day.exercises.filter((_, i) => i !== index),
    });
  };

  const handleMealsChange = (meals: PlanMeal[]) => {
    onChange({ meals });
  };

  // روز استراحت
  if (day.isRestDay) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Moon className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">روز استراحت</h3>
          <p className="text-sm text-muted-foreground mt-1">
            این روز برای ریکاوری در نظر گرفته شده است.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() =>
            onChange({
              isRestDay: false,
              title: `روز ${day.dayNumber}`,
              focus: "",
            })
          }
        >
          تبدیل به روز تمرینی
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* بخش تمرین */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">تمرینات روز</h3>
            <span className="text-xs text-muted-foreground">
              ({day.exercises.length} حرکت)
            </span>
          </div>

          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => setShowAddExercise(true)}
          >
            <Plus className="w-4 h-4" />
            افزودن حرکت
          </Button>
        </div>

        {day.exercises.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 p-10 text-center">
            <p className="text-muted-foreground text-sm mb-4">
              هنوز حرکتی اضافه نشده
            </p>
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowAddExercise(true)}
            >
              <Plus className="w-4 h-4" />
              اولین حرکت را اضافه کن
            </Button>
          </div>
        ) : (
          <ExerciseList
            exercises={day.exercises}
            onUpdate={handleUpdateExercise}
            onRemove={handleRemoveExercise}
          />
        )}

        {/* هشدار نرم */}
        {day.exercises.length > 0 && day.exercises.length < 3 && (
          <p className="text-xs text-amber-400">
            توصیه: حداقل ۳ حرکت برای یک روز تمرینی کامل
          </p>
        )}
        {day.exercises.length > 6 && (
          <p className="text-xs text-amber-400">
            هشدار نرم: بیش از ۶ حرکت ممکن است برای برخی شاگردان سنگین باشد
          </p>
        )}
      </section>

      {/* بخش تغذیه (ساده‌تر) */}
      <section className="space-y-4">
        <h3 className="font-semibold text-sm text-muted-foreground">
          تغذیه روز (اختیاری)
        </h3>
        <MealEditor meals={day.meals} onChange={handleMealsChange} />
      </section>

      {/* Sheet افزودن حرکت */}
      <AddExerciseSheet
        open={showAddExercise}
        onClose={() => setShowAddExercise(false)}
        onAdd={handleAddExercise}
      />
    </div>
  );
}
