"use client";

import { Trash2, GripVertical, Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { PlanExercise } from "@/lib/types/plan";

type Props = {
  exercises: PlanExercise[];
  onChange: (exercises: PlanExercise[]) => void;
  /** Hide the built-in empty state when the parent already renders one. */
  hideEmptyState?: boolean;
};

/** Mode-aware field surface — matches the rest of the plan builder. */
const FIELD_CLASS = cn(
  "transition-colors",
  "bg-card border-border",
  "hover:border-foreground/20",
  "focus-visible:border-primary/50 focus-visible:ring-primary/20",
  "dark:bg-white/[0.03] dark:border-white/10",
  "dark:hover:border-white/20",
  "dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20",
);

/** Kill number spinners + match tabular alignment. */
const NUMBER_CLASS = cn(
  "[appearance:textfield]",
  "[&::-webkit-outer-spin-button]:appearance-none",
  "[&::-webkit-inner-spin-button]:appearance-none",
);

export function ExerciseList({
  exercises,
  onChange,
  hideEmptyState = false,
}: Props) {
  const update = (index: number, patch: Partial<PlanExercise>) => {
    onChange(
      exercises.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)),
    );
  };

  const remove = (index: number) => {
    onChange(exercises.filter((_, i) => i !== index));
  };

  // ---- Empty state (opt-out) ----
  if (exercises.length === 0 && !hideEmptyState) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={cn(
          "rounded-2xl border border-dashed px-4 py-10 text-center",
          // LIGHT
          "border-border bg-card/60",
          // DARK
          "dark:border-white/15 dark:bg-white/2",
        )}
      >
        <div
          className={cn(
            "mx-auto mb-3 w-10 h-10 rounded-2xl flex items-center justify-center",
            "bg-primary/10 dark:bg-primary/15",
          )}
        >
          <Dumbbell className="w-5 h-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">هنوز حرکتی اضافه نشده</p>
        <p className="text-xs text-muted-foreground/70 mt-1">
          از دکمه «افزودن حرکت» استفاده کن
        </p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-2.5">
      <AnimatePresence initial={false}>
        {exercises.map((ex, index) => {
          // Stable key — prefer exerciseId, fall back to index-scoped key only if needed
          const key = ex.exerciseId ?? `ex-${index}`;

          return (
            <motion.div
              key={key}
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
                  "rounded-2xl overflow-hidden group/exercise",
                  // LIGHT: real card + soft elevation
                  "bg-card border-border shadow-sm shadow-foreground/4",
                  // DARK: glass
                  "dark:bg-white/5 dark:border-white/10 dark:shadow-none",
                  // Subtle hover elevation (desktop)
                  "hover:shadow-md hover:shadow-foreground/6",
                  "dark:hover:shadow-none dark:hover:border-white/20",
                  "transition-shadow",
                )}
              >
                <CardContent className="p-3.5 space-y-3">
                  {/* ---- Header ---- */}
                  <div className="flex items-start gap-2">
                    {/* Grip — decorative for now; add drag wiring later */}
                    <GripVertical
                      className={cn(
                        "w-4 h-4 mt-1 shrink-0 hidden sm:block select-none",
                        // LIGHT: visible but quiet
                        "text-muted-foreground/40 group-hover/exercise:text-muted-foreground/70",
                        // DARK
                        "dark:text-muted-foreground/40 dark:group-hover/exercise:text-muted-foreground/70",
                        "transition-colors",
                      )}
                      aria-hidden
                    />

                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="font-medium text-sm leading-snug text-foreground">
                        {ex.name}
                      </p>
                      {ex.muscle && (
                        <p className="text-[11px] text-muted-foreground">
                          {ex.muscle}
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`حذف ${ex.name}`}
                      onClick={() => remove(index)}
                      className={cn(
                        "h-8 w-8 shrink-0 transition-colors",
                        // LIGHT: muted by default, red on hover
                        "text-muted-foreground hover:text-destructive hover:bg-destructive/10",
                        // DARK: same idea, brighter on hover
                        "dark:hover:text-destructive dark:hover:bg-destructive/15",
                        // Reveal-on-hover on desktop, always visible on touch
                        "sm:opacity-60 sm:group-hover/exercise:opacity-100",
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* ---- Sets / Reps / Rest ---- */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground px-0.5">
                        ست
                      </p>
                      <Input
                        type="number"
                        min={1}
                        inputMode="numeric"
                        value={ex.sets}
                        onChange={(e) =>
                          update(index, { sets: Number(e.target.value) || 1 })
                        }
                        className={cn(
                          FIELD_CLASS,
                          NUMBER_CLASS,
                          "h-9 text-center tabular-nums",
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground px-0.5">
                        تکرار
                      </p>
                      <Input
                        value={ex.reps}
                        placeholder="8-12"
                        onChange={(e) =>
                          update(index, { reps: e.target.value })
                        }
                        className={cn(FIELD_CLASS, "h-9 text-center")}
                      />
                    </div>

                    <div className="space-y-1">
                      <p className="text-[10px] text-muted-foreground px-0.5">
                        استراحت (ث)
                      </p>
                      <Input
                        type="number"
                        min={0}
                        inputMode="numeric"
                        value={ex.restSeconds}
                        onChange={(e) =>
                          update(index, {
                            restSeconds: Number(e.target.value) || 0,
                          })
                        }
                        className={cn(
                          FIELD_CLASS,
                          NUMBER_CLASS,
                          "h-9 text-center tabular-nums",
                        )}
                      />
                    </div>
                  </div>

                  {/* ---- Compact summary ---- */}
                  {(ex.sets || ex.reps || ex.restSeconds) && (
                    <div
                      className={cn(
                        "flex items-center gap-2 text-[11px]",
                        "text-muted-foreground",
                      )}
                    >
                      <Dumbbell className="w-3 h-3 text-primary" />
                      <span className="tabular-nums">
                        {ex.sets.toLocaleString("fa-IR")} × {ex.reps || "—"}
                      </span>
                      {ex.restSeconds > 0 && (
                        <>
                          <span className="text-border">·</span>
                          <span className="tabular-nums">
                            استراحت {ex.restSeconds.toLocaleString("fa-IR")}{" "}
                            ثانیه
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
