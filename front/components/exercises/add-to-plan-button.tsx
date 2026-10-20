"use client";

import { useState, useEffect } from "react"; // ✅ Add useEffect
import Link from "next/link";
import { Plus, Check, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useWorkoutStore } from "@/lib/store/workout-store";
import type { Exercise } from "@/lib/data/exercises";
import { useRouter } from "next/navigation";

type AddToPlanButtonProps = {
  exercise: Exercise;
};

export function AddToPlanButton({ exercise }: AddToPlanButtonProps) {
  const addExerciseFromLibrary = useWorkoutStore(
    (s) => s.addExerciseFromLibrary,
  );
  const isInTodayPlan = useWorkoutStore((s) => s.isInTodayPlan);

  // ✅ Add hydration state
  const [mounted, setMounted] = useState(false);

  // ✅ Only check if in plan after hydration
  const [alreadyAdded, setAlreadyAdded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const router = useRouter();

  // ✅ Check if exercise is in plan after hydration
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    setAlreadyAdded(isInTodayPlan(exercise.id));
  }, [isInTodayPlan, exercise.id]);

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
            router.push("/workout/today");
          },
        },
      });
    } else {
      toast.error(result.message);
    }
  };

  const isAdded = alreadyAdded || justAdded;

  // ✅ Render a placeholder during SSR to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-2">
        <Button
          className="w-full h-12 text-base gap-2"
          disabled={true}
          variant="default"
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          بارگذاری...
        </Button>
      </div>
    );
  }

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
