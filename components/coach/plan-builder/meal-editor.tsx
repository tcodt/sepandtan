"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlanMeal } from "@/lib/types/plan";

type Props = {
  meals: PlanMeal[];
  onChange: (meals: PlanMeal[]) => void;
};

const mealTypes: PlanMeal["type"][] = ["breakfast", "snack", "lunch", "dinner"];

const typeLabels: Record<PlanMeal["type"], string> = {
  breakfast: "صبحانه",
  snack: "میان‌وعده",
  lunch: "ناهار",
  dinner: "شام",
};

export function MealEditor({ meals, onChange }: Props) {
  const addMeal = () => {
    const nextType =
      mealTypes.find((t) => !meals.some((m) => m.type === t)) ?? "snack";

    onChange([
      ...meals,
      {
        id: `meal-${Date.now()}`,
        type: nextType,
        title: "",
        description: "",
      },
    ]);
  };

  const updateMeal = (index: number, patch: Partial<PlanMeal>) => {
    const next = [...meals];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeMeal = (index: number) => {
    onChange(meals.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {meals.map((meal, index) => (
        <div
          key={meal.id}
          className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2"
        >
          <div className="flex items-center justify-between gap-2">
            <select
              value={meal.type}
              onChange={(e) =>
                updateMeal(index, {
                  type: e.target.value as PlanMeal["type"],
                })
              }
              className="text-xs bg-black/30 border border-white/10 rounded-lg px-2 py-1"
            >
              {mealTypes.map((t) => (
                <option key={t} value={t}>
                  {typeLabels[t]}
                </option>
              ))}
            </select>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => removeMeal(index)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Input
            value={meal.title}
            onChange={(e) => updateMeal(index, { title: e.target.value })}
            placeholder="عنوان وعده"
            className="h-9 bg-black/20 border-white/10"
          />
          <Input
            value={meal.description}
            onChange={(e) => updateMeal(index, { description: e.target.value })}
            placeholder="توضیح کوتاه"
            className="h-9 bg-black/20 border-white/10"
          />
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-1.5"
        onClick={addMeal}
      >
        <Plus className="w-4 h-4" />
        افزودن وعده
      </Button>
    </div>
  );
}
