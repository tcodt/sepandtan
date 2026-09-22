"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Moon, Dumbbell, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlanDay, PlanExercise } from "@/lib/types/plan";
import { ExerciseList } from "./exercise-list";
import { MealEditor } from "./meal-editor";
import { AddExerciseSheet } from "./add-exercise-sheet";

type Props = {
  day: PlanDay;
  onChange: (patch: Partial<PlanDay>) => void;
};

type Tab = "exercises" | "meals";

/** Mode-aware field surface — matches PlanMetaForm. */
const FIELD_CLASS = cn(
  "h-10 transition-colors",
  "bg-card border-border",
  "hover:border-foreground/20",
  "focus-visible:border-primary/50 focus-visible:ring-primary/20",
  "dark:bg-white/[0.03] dark:border-white/10",
  "dark:hover:border-white/20",
  "dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20",
);

/** Shared transparent, smooth scrollbar (WebKit + Firefox). */
const SMOOTH_SCROLL = cn(
  "overflow-y-auto overscroll-contain",
  "scroll-smooth",
  // WebKit
  "[&::-webkit-scrollbar]:w-2",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full",
  "[&::-webkit-scrollbar-thumb]:bg-foreground/10",
  "[&::-webkit-scrollbar-thumb:hover]:bg-foreground/20",
  "dark:[&::-webkit-scrollbar-thumb]:bg-white/10",
  "dark:[&::-webkit-scrollbar-thumb:hover]:bg-white/20",
  // Firefox
  "[scrollbar-width:thin]",
  "[scrollbar-color:theme(colors.foreground/10)_transparent]",
  "dark:[scrollbar-color:rgb(255_255_255_/_0.1)_transparent]",
);

export function DayEditor({ day, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("exercises");
  const [addOpen, setAddOpen] = useState(false);

  const addExercise = (exercise: PlanExercise) => {
    onChange({ exercises: [...day.exercises, exercise] });
  };

  const tabs = [
    {
      key: "exercises" as const,
      label: "تمرین",
      icon: Dumbbell,
      count: day.exercises.length,
    },
    {
      key: "meals" as const,
      label: "تغذیه",
      icon: UtensilsCrossed,
      count: day.meals.length,
    },
  ];

  return (
    <div className="space-y-5">
      {/* ============ Day meta card ============ */}
      <Card
        className={cn(
          "rounded-2xl overflow-hidden",
          // LIGHT
          "bg-card border-border shadow-sm shadow-foreground/4",
          // DARK
          "dark:bg-white/5 dark:border-white/10 dark:shadow-none",
        )}
      >
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <motion.span
                animate={{
                  rotate: day.isRestDay ? -12 : 0,
                  scale: day.isRestDay ? 1.05 : 1,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="inline-flex"
              >
                {day.isRestDay ? (
                  <Moon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                ) : (
                  <Dumbbell className="w-4 h-4 text-primary" />
                )}
              </motion.span>
              <Label
                htmlFor="rest-toggle"
                className="text-sm font-medium cursor-pointer"
              >
                روز استراحت
              </Label>
            </div>
            <Switch
              id="rest-toggle"
              checked={day.isRestDay}
              onCheckedChange={(checked) =>
                onChange({
                  isRestDay: checked,
                  title: checked
                    ? "روز استراحت"
                    : day.title || `روز ${day.dayNumber}`,
                })
              }
            />
          </div>

          <AnimatePresence initial={false}>
            {!day.isRestDay && (
              <motion.div
                key="day-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      عنوان روز
                    </Label>
                    <Input
                      value={day.title}
                      onChange={(e) => onChange({ title: e.target.value })}
                      placeholder="مثلاً: سینه و جلوبازو"
                      className={FIELD_CLASS}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      تمرکز
                    </Label>
                    <Input
                      value={day.focus ?? ""}
                      onChange={(e) => onChange({ focus: e.target.value })}
                      placeholder="مثلاً: بالاتنه"
                      className={FIELD_CLASS}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* ============ Rest day branch ============ */}
      {day.isRestDay ? (
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={cn(
              "rounded-2xl border px-5 py-10 text-center space-y-3",
              // LIGHT: readable sky on light
              "bg-sky-50 border-sky-200 dark:bg-sky-500/5 dark:border-sky-500/20",
            )}
          >
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className={cn(
                "mx-auto w-12 h-12 rounded-2xl flex items-center justify-center",
                "bg-sky-100 dark:bg-sky-500/10",
              )}
            >
              <Moon className="w-6 h-6 text-sky-600 dark:text-sky-400" />
            </motion.div>
            <p className="font-semibold text-sky-900 dark:text-sky-100">
              روز ریکاوری
            </p>
            <p className="text-sm text-sky-800/70 dark:text-muted-foreground max-w-sm mx-auto leading-relaxed">
              در این روز حرکت تمرینی ثبت نمی‌شود. می‌توانی وعده‌های غذایی را
              تنظیم کنی.
            </p>
          </motion.div>

          {/* Real meal editor — always rendered, not hidden behind tab */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.05 }}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <UtensilsCrossed className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">
                وعده‌های غذایی
              </h3>
            </div>
            <div className={cn("max-h-[60vh] rounded-2xl", SMOOTH_SCROLL)}>
              <MealEditor
                meals={day.meals}
                onChange={(meals) => onChange({ meals })}
              />
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          {/* ============ Tab bar ============ */}
          <div
            role="tablist"
            aria-label="ویرایش روز"
            className={cn(
              "relative flex gap-1 p-1 rounded-xl border",
              // LIGHT
              "bg-muted/60 border-border",
              // DARK
              "dark:bg-white/5 dark:border-white/10",
            )}
          >
            {tabs.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "relative flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {/* Shared sliding background */}
                  {active && (
                    <motion.span
                      layoutId="dayeditor-tab-bg"
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 32,
                      }}
                      className={cn(
                        "absolute inset-0 rounded-lg bg-primary",
                        // LIGHT: subtle orange shadow under active tab
                        "shadow-sm shadow-primary/25",
                        // DARK: none
                        "dark:shadow-none",
                      )}
                    />
                  )}

                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    <t.icon className="w-4 h-4" />
                    {t.label}
                    <span
                      className={cn(
                        "text-[10px] tabular-nums px-1.5 py-0.5 rounded-md transition-colors",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : // LIGHT: visible on muted tab bar
                            "bg-foreground/5 text-muted-foreground dark:bg-white/10 dark:text-foreground/80",
                      )}
                    >
                      {t.count.toLocaleString("fa-IR")}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* ============ Tab content ============ */}
          <AnimatePresence mode="wait" initial={false}>
            {tab === "exercises" ? (
              <motion.div
                key="exercises"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-3"
              >
                {day.exercises.length === 0 ? (
                  <EmptyExercises onAdd={() => setAddOpen(true)} />
                ) : (
                  <div
                    className={cn(
                      "max-h-[60vh] rounded-2xl -mx-1 px-1",
                      SMOOTH_SCROLL,
                    )}
                  >
                    <ExerciseList
                      exercises={day.exercises}
                      onChange={(exercises) => onChange({ exercises })}
                    />
                  </div>
                )}

                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <Button
                    type="button"
                    className={cn(
                      "w-full h-11 gap-2 font-semibold",
                      // LIGHT: warm shadow under orange CTA
                      "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25",
                      // DARK: glow
                      "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
                    )}
                    onClick={() => setAddOpen(true)}
                  >
                    <Plus className="w-4 h-4" />
                    افزودن حرکت
                  </Button>
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="meals"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={cn("max-h-[60vh] rounded-2xl", SMOOTH_SCROLL)}
              >
                <MealEditor
                  meals={day.meals}
                  onChange={(meals) => onChange({ meals })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <AddExerciseSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addExercise}
      />
    </div>
  );
}

/** Nice empty state when there are no exercises yet. */
function EmptyExercises({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-2xl border border-dashed px-5 py-10 text-center space-y-3",
        // LIGHT
        "bg-card/60 border-border",
        // DARK
        "dark:bg-white/2 dark:border-white/10",
      )}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className={cn(
          "mx-auto w-12 h-12 rounded-2xl flex items-center justify-center",
          "bg-primary/10 dark:bg-primary/15",
        )}
      >
        <Dumbbell className="w-6 h-6 text-primary" />
      </motion.div>
      <div className="space-y-1">
        <p className="font-semibold text-foreground">هنوز حرکتی اضافه نشده</p>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          برای این روز تمرین، از دکمه زیر حرکت اضافه کن.
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onAdd}
        className={cn(
          "gap-1.5",
          "bg-card border-border hover:bg-accent hover:border-foreground/20",
          "dark:bg-transparent dark:border-white/15 dark:hover:bg-white/5",
        )}
      >
        <Plus className="w-4 h-4" />
        افزودن حرکت
      </Button>
    </motion.div>
  );
}
