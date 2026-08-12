"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkoutExercise } from "@/lib/store/workout-store";
import { cn } from "@/lib/utils";
import { RestTimer } from "./rest-timer";

type ActiveExerciseProps = {
  exercise: WorkoutExercise;
  currentSetIndex: number;
  onCompleteSet: (setIndex: number) => void;
  onCompleteExercise: () => void;
  onClose: () => void;
};

export function ActiveExercise({
  exercise,
  currentSetIndex,
  onCompleteSet,
  onCompleteExercise,
  onClose,
}: ActiveExerciseProps) {
  const [showRest, setShowRest] = useState(false);
  const totalSets = exercise.sets;
  const isLastSet = currentSetIndex >= totalSets - 1;

  const handleSetDone = () => {
    onCompleteSet(currentSetIndex);

    if (isLastSet) {
      onCompleteExercise();
    } else {
      setShowRest(true);
    }
  };

  const handleRestComplete = () => {
    setShowRest(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border">
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{exercise.name}</p>
          <p className="text-xs text-muted-foreground">
            ست {Math.min(currentSetIndex + 1, totalSets)} از {totalSets}
          </p>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">
        {showRest ? (
          <RestTimer
            seconds={exercise.restSeconds}
            onComplete={handleRestComplete}
            onSkip={handleRestComplete}
          />
        ) : (
          <>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">تکرار هدف</p>
              <p className="text-5xl font-bold text-foreground tabular-nums">
                {exercise.reps}
              </p>
              <p className="text-sm text-muted-foreground">
                ست {currentSetIndex + 1} از {totalSets}
              </p>
            </div>

            {/* Set indicators */}
            <div className="flex items-center gap-2">
              {Array.from({ length: totalSets }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-3 h-3 rounded-full transition-colors",
                    i < currentSetIndex
                      ? "bg-primary"
                      : i === currentSetIndex
                        ? "bg-primary/40 ring-2 ring-primary"
                        : "bg-muted"
                  )}
                />
              ))}
            </div>

            <Button
              size="lg"
              className="w-full max-w-xs h-14 text-base gap-2"
              onClick={handleSetDone}
            >
              <Check className="w-5 h-5" />
              {isLastSet ? "تموم شد – حرکت بعدی" : "ست انجام شد"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}