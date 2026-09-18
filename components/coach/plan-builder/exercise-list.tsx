"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlanExercise } from "@/lib/types/plan";

type Props = {
  exercises: PlanExercise[];
  onUpdate: (index: number, exercise: PlanExercise) => void;
  onRemove: (index: number) => void;
};

export function ExerciseList({ exercises, onUpdate, onRemove }: Props) {
  return (
    <div className="space-y-3">
      {exercises.map((ex, index) => (
        <div
          key={`${ex.exerciseId}-${index}`}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{ex.name}</p>
              <p className="text-xs text-muted-foreground">{ex.muscle}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => onRemove(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-muted-foreground">ست</label>
              <Input
                type="number"
                min={1}
                value={ex.sets}
                onChange={(e) =>
                  onUpdate(index, {
                    ...ex,
                    sets: Math.max(1, Number(e.target.value) || 1),
                  })
                }
                className="h-9 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">تکرار</label>
              <Input
                value={ex.reps}
                onChange={(e) =>
                  onUpdate(index, { ...ex, reps: e.target.value })
                }
                placeholder="۸-۱۲"
                className="h-9 bg-black/20 border-white/10"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground">
                استراحت (ثانیه)
              </label>
              <Input
                type="number"
                min={0}
                value={ex.restSeconds}
                onChange={(e) =>
                  onUpdate(index, {
                    ...ex,
                    restSeconds: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                className="h-9 bg-black/20 border-white/10"
              />
            </div>
          </div>

          <Input
            value={ex.notes ?? ""}
            onChange={(e) =>
              onUpdate(index, { ...ex, notes: e.target.value || undefined })
            }
            placeholder="نکته مربی (اختیاری)"
            className="h-9 bg-black/20 border-white/10 text-sm"
          />
        </div>
      ))}
    </div>
  );
}
