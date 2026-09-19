"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { PlanExercise } from "@/lib/types/plan";
import {
  exercises as allExercises,
  muscleLabels,
  type Exercise,
} from "@/lib/data/exercises";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (exercise: PlanExercise) => void;
};

function getMuscleLabel(ex: Exercise): string {
  if (!ex.primaryMuscles?.length) return "";
  return ex.primaryMuscles.map((m) => muscleLabels[m] ?? m).join("، ");
}

export function AddExerciseSheet({ open, onClose, onAdd }: Props) {
  const [mode, setMode] = useState<"library" | "custom">("library");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);

  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("8-12");
  const [restSeconds, setRestSeconds] = useState(90);

  const [customName, setCustomName] = useState("");
  const [customMuscle, setCustomMuscle] = useState("");

  const isDesktop = useMediaQuery("(min-width: 768px)");

  const filtered = useMemo(() => {
    if (!query.trim()) return allExercises.slice(0, 30);
    const q = query.trim().toLowerCase();
    return allExercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.nameEn.toLowerCase().includes(q) ||
          e.primaryMuscles.some((m) => (muscleLabels[m] ?? m).includes(q)),
      )
      .slice(0, 30);
  }, [query]);

  const resetCommon = () => {
    setSets(3);
    setReps("8-12");
    setRestSeconds(90);
  };

  const handleConfirmLibrary = () => {
    if (!selected) return;

    onAdd({
      exerciseId: selected.id,
      name: selected.name,
      muscle: getMuscleLabel(selected),
      sets,
      reps,
      restSeconds,
    });

    setSelected(null);
    setQuery("");
    resetCommon();
    onClose();
  };

  const handleConfirmCustom = () => {
    if (!customName.trim()) return;

    onAdd({
      exerciseId: `custom_${Date.now()}`,
      name: customName.trim(),
      muscle: customMuscle.trim() || "سایر",
      sets,
      reps,
      restSeconds,
    });

    setCustomName("");
    setCustomMuscle("");
    resetCommon();
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "bg-muted border-white/10 p-4 md:p-8",
          "h-[80vh] rounded-t-3xl",
          "md:h-full md:w-120 md:max-w-full md:rounded-none md:rounded-l-3xl",
        )}
      >
        <SheetHeader>
          <SheetTitle>افزودن حرکت</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant={mode === "library" ? "default" : "outline"}
              onClick={() => {
                setMode("library");
                setSelected(null);
              }}
            >
              کتابخانه
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === "custom" ? "default" : "outline"}
              onClick={() => {
                setMode("custom");
                setSelected(null);
              }}
            >
              حرکت سفارشی
            </Button>
          </div>

          {mode === "library" ? (
            <>
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="جستجوی حرکت یا عضله..."
                  className="pr-10"
                />
              </div>

              {!selected ? (
                <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                  {filtered.map((ex) => (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => setSelected(ex)}
                      className="w-full text-right px-4 py-3 rounded-xl hover:bg-white/5 transition-colors"
                    >
                      <p className="font-medium text-sm">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {getMuscleLabel(ex)}
                      </p>
                    </button>
                  ))}

                  {filtered.length === 0 && (
                    <div className="text-center py-8 space-y-3">
                      <p className="text-sm text-muted-foreground">
                        حرکتی پیدا نشد
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setMode("custom")}
                      >
                        افزودن حرکت سفارشی
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-white/5 p-4">
                    <p className="font-medium">{selected.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {getMuscleLabel(selected)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">ست</Label>
                      <Input
                        type="number"
                        min={1}
                        value={sets}
                        onChange={(e) => setSets(Number(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">تکرار</Label>
                      <Input
                        value={reps}
                        onChange={(e) => setReps(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">استراحت (ث)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={restSeconds}
                        onChange={(e) =>
                          setRestSeconds(Number(e.target.value) || 0)
                        }
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setSelected(null)}
                    >
                      بازگشت
                    </Button>
                    <Button className="flex-1" onClick={handleConfirmLibrary}>
                      افزودن
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>نام حرکت</Label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="مثلاً: اسکوات هالتر پایی"
                />
              </div>

              <div className="space-y-2">
                <Label>عضله درگیر</Label>
                <Input
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value)}
                  placeholder="مثلاً: پا"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">ست</Label>
                  <Input
                    type="number"
                    min={1}
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">تکرار</Label>
                  <Input
                    value={reps}
                    onChange={(e) => setReps(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">استراحت (ث)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={restSeconds}
                    onChange={(e) =>
                      setRestSeconds(Number(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!customName.trim()}
                onClick={handleConfirmCustom}
              >
                افزودن حرکت سفارشی
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
