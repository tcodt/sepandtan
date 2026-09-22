"use client";

import { Plus, Trash2, Flame, Beef, Wheat, Droplet } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PlanMeal } from "@/lib/types/plan";

type Props = {
  meals: PlanMeal[];
  onChange: (meals: PlanMeal[]) => void;
};

const MEAL_TYPES = [
  { value: "breakfast", label: "صبحانه" },
  { value: "lunch", label: "ناهار" },
  { value: "dinner", label: "شام" },
  { value: "snack", label: "میان‌وعده" },
] as const;

/** Mode-aware field surface — same pattern used in PlanMetaForm / DayEditor. */
const FIELD_CLASS = cn(
  "transition-colors",
  "bg-card border-border",
  "hover:border-foreground/20",
  "focus-visible:border-primary/50 focus-visible:ring-primary/20",
  "dark:bg-white/[0.03] dark:border-white/10",
  "dark:hover:border-white/20",
  "dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20",
);

/** Kill spinners + match tabular alignment for numbers. */
const NUMBER_CLASS = cn(
  "[appearance:textfield]",
  "[&::-webkit-outer-spin-button]:appearance-none",
  "[&::-webkit-inner-spin-button]:appearance-none",
);

export function MealEditor({ meals, onChange }: Props) {
  const updateMeal = (index: number, patch: Partial<PlanMeal>) => {
    onChange(meals.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const removeMeal = (index: number) => {
    onChange(meals.filter((_, i) => i !== index));
  };

  const addMeal = () => {
    onChange([
      ...meals,
      {
        id:
          typeof crypto !== "undefined" && "randomUUID" in crypto
            ? crypto.randomUUID()
            : `meal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: "snack",
        title: "",
        description: "",
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      },
    ]);
  };

  const totalCalories = meals.reduce((s, m) => s + (m.calories ?? 0), 0);

  return (
    <div className="space-y-3">
      {/* ============ Empty state ============ */}
      <AnimatePresence initial={false}>
        {meals.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "rounded-2xl border border-dashed px-4 py-8 text-center",
              // LIGHT: visible dashed border
              "border-border bg-card/60",
              // DARK: subtle glass
              "dark:border-white/15 dark:bg-white/2",
            )}
          >
            <p className="text-sm text-muted-foreground">وعده‌ای ثبت نشده</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              برای شروع، یک وعده اضافه کن
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Meal list ============ */}
      <AnimatePresence initial={false}>
        {meals.map((meal, index) => (
          <motion.div
            key={meal.id}
            layout
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              x: 12,
              scale: 0.97,
              transition: { duration: 0.18 },
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <Card
              className={cn(
                "rounded-2xl overflow-hidden group/meal",
                // LIGHT: real card + soft elevation
                "bg-card border-border shadow-sm shadow-foreground/4",
                // DARK: glass
                "dark:bg-white/5 dark:border-white/10 dark:shadow-none",
              )}
            >
              <CardContent className="p-3.5 space-y-3">
                {/* ---- Header: type + delete ---- */}
                <div className="flex items-center justify-between gap-2">
                  <Select
                    value={meal.type}
                    onValueChange={(v) =>
                      updateMeal(index, { type: v as PlanMeal["type"] })
                    }
                  >
                    <SelectTrigger
                      className={cn(FIELD_CLASS, "h-9 w-34 text-sm")}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MEAL_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="حذف وعده"
                    onClick={() => removeMeal(index)}
                    className={cn(
                      "h-8 w-8 text-muted-foreground transition-colors",
                      // LIGHT: destructive on hover
                      "hover:text-destructive hover:bg-destructive/10",
                      // DARK: same hover, brighter default
                      "dark:text-muted-foreground",
                      "dark:hover:text-destructive dark:hover:bg-destructive/15",
                      // Reveal-on-hover on desktop, always visible on touch
                      "sm:opacity-60 sm:group-hover/meal:opacity-100",
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* ---- Title + description ---- */}
                <Input
                  value={meal.title}
                  onChange={(e) => updateMeal(index, { title: e.target.value })}
                  placeholder="عنوان وعده"
                  className={cn(FIELD_CLASS, "h-9")}
                />
                <Input
                  value={meal.description ?? ""}
                  onChange={(e) =>
                    updateMeal(index, { description: e.target.value })
                  }
                  placeholder="توضیح کوتاه (اختیاری)"
                  className={cn(FIELD_CLASS, "h-9")}
                />

                {/* ---- Macros ---- */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    [
                      ["calories", "کالری", Flame],
                      ["protein", "پروتئین", Beef],
                      ["carbs", "کربوهیدرات", Wheat],
                      ["fat", "چربی", Droplet],
                    ] as const
                  ).map(([key, label, Icon]) => (
                    <div key={key} className="space-y-1">
                      <p className="flex items-center gap-1 text-[10px] text-muted-foreground px-0.5">
                        <Icon className="w-3 h-3" />
                        {label}
                      </p>
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={meal[key] ?? 0}
                        onChange={(e) =>
                          updateMeal(index, {
                            [key]: Number(e.target.value) || 0,
                          })
                        }
                        className={cn(
                          FIELD_CLASS,
                          NUMBER_CLASS,
                          "h-8 text-center text-xs tabular-nums",
                        )}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* ============ Add button ============ */}
      <motion.div
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.99 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addMeal}
          className={cn(
            "w-full h-10 gap-1.5 border-dashed",
            // LIGHT: visible dashed outline + hover tint
            "bg-card border-border text-foreground/80",
            "hover:bg-primary/5 hover:border-primary/40 hover:text-primary",
            // DARK
            "dark:bg-transparent dark:border-white/15 dark:text-foreground",
            "dark:hover:bg-primary/10 dark:hover:border-primary/40 dark:hover:text-primary",
            "transition-colors",
          )}
        >
          <Plus className="w-4 h-4" />
          افزودن وعده
        </Button>
      </motion.div>

      {/* ============ Total summary ============ */}
      <AnimatePresence>
        {meals.length > 0 && totalCalories > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "flex items-center justify-between px-3 py-2 rounded-xl text-xs",
              // LIGHT: warm orange pill
              "bg-primary/8 border border-primary/20",
              // DARK: glassy
              "dark:bg-primary/10 dark:border-primary/25",
            )}
          >
            <span className="text-muted-foreground">
              مجموع وعده‌های ثبت‌شده
            </span>
            <span className="inline-flex items-center gap-1 font-semibold text-primary tabular-nums">
              <Flame className="w-3.5 h-3.5" />
              {totalCalories.toLocaleString("fa-IR")} کالری
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
