"use client";

import { CheckCircle2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WorkoutExercise } from "@/lib/store/workout-store";

type SessionExerciseCardProps = {
  exercise: WorkoutExercise;
  index: number;
  isActive: boolean;
  onStart: () => void;
};

export function SessionExerciseCard({
  exercise,
  index,
  isActive,
  onStart,
}: SessionExerciseCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 rounded-2xl border transition-all",
        exercise.completed
          ? "border-primary/30 bg-primary/5"
          : isActive
            ? "border-primary bg-primary/10 shadow-sm"
            : "border-border bg-card/80 dark:bg-card/60 hover:bg-muted/50",
      )}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium text-muted-foreground shrink-0">
        {exercise.completed ? (
          <CheckCircle2 className="w-5 h-5 text-primary" />
        ) : (
          index + 1
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-semibold truncate",
            exercise.completed ? "text-primary" : "text-foreground",
          )}
        >
          {exercise.name}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {exercise.sets} ست × {exercise.reps} تکرار · استراحت{" "}
          {exercise.restSeconds}ث
        </p>
        {exercise.muscle && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {exercise.muscle}
          </p>
        )}
      </div>

      {!exercise.completed && (
        <Button
          size="sm"
          variant={isActive ? "default" : "outline"}
          className="shrink-0 gap-1.5"
          onClick={onStart}
        >
          <Play className="w-3.5 h-3.5" />
          {isActive ? "در حال اجرا" : "شروع"}
        </Button>
      )}
    </div>
  );
}
