"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Check, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWorkoutStore } from "@/lib/store/workout-store";
import type { Exercise } from "@/lib/data/exercises";

type AddToPlanButtonProps = {
  exercise: Exercise;
};

export function AddToPlanButton({ exercise }: AddToPlanButtonProps) {
  const addExerciseFromLibrary = useWorkoutStore(
    (s) => s.addExerciseFromLibrary,
  );
  const isInTodayPlan = useWorkoutStore((s) => s.isInTodayPlan);

  const alreadyAdded = isInTodayPlan(exercise.id);
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = async () => {
    if (alreadyAdded || justAdded) return;

    setLoading(true);

    // کمی تأخیر برای حس طبیعی UI (اختیاری)
    await new Promise((r) => setTimeout(r, 400));

    const result = addExerciseFromLibrary(exercise);

    setLoading(false);

    if (result.ok) {
      setJustAdded(true);
      toast.success(result.message, {
        action: {
          label: "برو به تمرین",
          onClick: () => {
            window.location.href = "/workout/today";
          },
        },
      });
    } else {
      toast.error(result.message);
    }
  };

  const isAdded = alreadyAdded || justAdded;

  return (
    <div className="space-y-2">
      <Button
        className="w-full h-12 text-base gap-2"
        onClick={handleAdd}
        disabled={loading || isAdded}
        variant={isAdded ? "secondary" : "default"}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            در حال افزودن...
          </>
        ) : isAdded ? (
          <>
            <Check className="w-4 h-4" />
            در برنامه امروز هست
          </>
        ) : (
          <>
            <Plus className="w-4 h-4" />
            افزودن به برنامه امروز
          </>
        )}
      </Button>

      {isAdded && (
        <Button asChild variant="outline" className="w-full gap-1">
          <Link href="/workout/today">
            رفتن به تمرین امروز
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
