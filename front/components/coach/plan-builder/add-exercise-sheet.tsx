"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Library, Pencil, Dumbbell, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PlanExercise } from "@/lib/types/plan";
import {
  exercises as allExercises,
  muscleLabels,
  type Exercise,
} from "@/lib/data/exercises";
import { useMediaQuery } from "@/hooks/use-media-query";

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (exercise: PlanExercise) => void;
};

function getMuscleLabel(ex: Exercise): string {
  if (!ex.primaryMuscles?.length) return "";
  return ex.primaryMuscles.map((m) => muscleLabels[m] ?? m).join("، ");
}

/** Mode-aware field surface — consistent across the plan builder. */
const FIELD_CLASS = cn(
  "transition-colors",
  "bg-card border-border",
  "hover:border-foreground/20",
  "focus-visible:border-primary/50 focus-visible:ring-primary/20",
  "dark:bg-white/[0.03] dark:border-white/10",
  "dark:hover:border-white/20",
  "dark:focus-visible:border-primary/60 dark:focus-visible:ring-primary/20",
);

/** Hidden, thin, transparent scrollbar. */
const SMOOTH_SCROLL = cn(
  "overflow-y-auto overscroll-contain scroll-smooth",
  "[-webkit-overflow-scrolling:touch]",
  // Firefox
  "[scrollbar-width:none]",
  // WebKit — fully hidden
  "[&::-webkit-scrollbar]:hidden",
  "[&::-webkit-scrollbar]:w-0",
  "[&::-webkit-scrollbar]:h-0",
  "[&::-webkit-scrollbar-thumb]:bg-transparent",
  "[&::-webkit-scrollbar-track]:bg-transparent",
);

const NUMBER_CLASS = cn(
  "[appearance:textfield]",
  "[&::-webkit-outer-spin-button]:appearance-none",
  "[&::-webkit-inner-spin-button]:appearance-none",
);

export function AddExerciseSheet({ open, onClose, onAdd }: Props) {
  const [mode, setMode] = useState<"library" | "custom">("library");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Exercise | null>(null);

  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState("8-12");
  const [restSeconds, setRestSeconds] = useState(90);

  const [customName, setCustomName] = useState("");
  const [customMuscle, setCustomMuscle] = useState("");

  const searchRef = useRef<HTMLInputElement>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const filtered = useMemo(() => {
    if (!query.trim()) return allExercises.slice(0, 40);
    const q = query.trim().toLowerCase();
    return allExercises
      .filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.nameEn.toLowerCase().includes(q) ||
          e.primaryMuscles.some((m) =>
            (muscleLabels[m] ?? m).toLowerCase().includes(q),
          ),
      )
      .slice(0, 40);
  }, [query]);

  // Auto-focus search when opening in library mode
  useEffect(() => {
    if (open && mode === "library" && !selected) {
      // slight delay so the sheet's mount animation finishes
      const t = setTimeout(() => searchRef.current?.focus(), 200);
      return () => clearTimeout(t);
    }
  }, [open, mode, selected]);

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
      exerciseId: `custom_${
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Date.now()
      }`,
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
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent
        side={isDesktop ? "right" : "bottom"}
        className={cn(
          "p-4 md:p-6 overflow-y-auto",
          // LIGHT: real card surface, visible border
          "bg-card border-border",
          "shadow-xl shadow-foreground/8",
          // DARK: glass
          "dark:bg-muted dark:border-white/10 dark:shadow-2xl dark:shadow-black/40",
          // Shape
          "h-[85vh] rounded-t-3xl",
          "md:h-full md:w-md md:max-w-full md:rounded-none md:rounded-l-3xl",
          // Hide the sheet's own scrollbar too
          SMOOTH_SCROLL,
        )}
      >
        {/* ---- Header ---- */}
        <SheetHeader className="text-right space-y-1.5 pb-2">
          <SheetTitle className="text-foreground">افزودن حرکت</SheetTitle>
          <SheetDescription className="text-muted-foreground">
            از کتابخانه انتخاب کن یا حرکت سفارشی بساز
          </SheetDescription>
        </SheetHeader>

        {/* ---- Mode toggle ---- */}
        <div
          role="tablist"
          aria-label="حالت افزودن حرکت"
          className={cn(
            "relative flex gap-1 p-1 rounded-xl border mt-3 mb-4",
            // LIGHT: visible muted container
            "bg-muted/60 border-border",
            // DARK
            "dark:bg-white/5 dark:border-white/10",
          )}
        >
          {(
            [
              { key: "library" as const, label: "کتابخانه", icon: Library },
              { key: "custom" as const, label: "سفارشی", icon: Pencil },
            ] as const
          ).map((m) => {
            const active = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setMode(m.key);
                  setSelected(null);
                }}
                className={cn(
                  "relative flex-1 flex items-center justify-center gap-1.5 h-9 rounded-lg text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  active
                    ? "text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="add-exercise-tab-bg"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className={cn(
                      "absolute inset-0 rounded-lg bg-primary",
                      // LIGHT: subtle orange shadow under active tab
                      "shadow-sm shadow-primary/25",
                      "dark:shadow-none",
                    )}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-1.5">
                  <m.icon className="w-4 h-4" />
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ---- Body ---- */}
        <div className="space-y-4">
          <AnimatePresence mode="wait" initial={false}>
            {mode === "library" ? (
              <motion.div
                key="library"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-4"
              >
                {!selected ? (
                  <>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        ref={searchRef}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="جستجوی حرکت..."
                        className={cn(FIELD_CLASS, "h-11 pr-10")}
                      />
                      {query && (
                        <button
                          type="button"
                          aria-label="پاک کردن جستجو"
                          onClick={() => {
                            setQuery("");
                            searchRef.current?.focus();
                          }}
                          className={cn(
                            "absolute left-2 top-1/2 -translate-y-1/2",
                            "flex items-center justify-center w-6 h-6 rounded-full",
                            "text-muted-foreground hover:text-foreground",
                            "hover:bg-muted/70 dark:hover:bg-white/10",
                            "transition-colors",
                          )}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Exercise list */}
                    <div
                      className={cn(
                        "space-y-1.5 max-h-[50vh] -mx-1 px-1",
                        SMOOTH_SCROLL,
                      )}
                    >
                      <AnimatePresence initial={false}>
                        {filtered.map((ex, i) => (
                          <motion.button
                            key={ex.id}
                            type="button"
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{
                              duration: 0.15,
                              delay: Math.min(i * 0.012, 0.15),
                            }}
                            onClick={() => setSelected(ex)}
                            className={cn(
                              "w-full text-right px-3.5 py-3 rounded-xl border transition-colors",
                              // LIGHT: real card + visible hover
                              "bg-card border-border",
                              "hover:bg-muted/70 hover:border-foreground/20",
                              // DARK: glass
                              "dark:bg-white/5 dark:border-white/10",
                              "dark:hover:bg-white/8 dark:hover:border-white/20",
                            )}
                          >
                            <p className="text-sm font-medium text-foreground">
                              {ex.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {getMuscleLabel(ex)}
                            </p>
                          </motion.button>
                        ))}
                      </AnimatePresence>

                      {filtered.length === 0 && (
                        <motion.div
                          key="no-results"
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "rounded-2xl border border-dashed px-4 py-8 text-center",
                            "border-border bg-card/60",
                            "dark:border-white/15 dark:bg-white/2",
                          )}
                        >
                          <Dumbbell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            حرکتی پیدا نشد
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            می‌تونی از تب «سفارشی» حرکت جدید بسازی
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {/* Selected preview */}
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "rounded-xl border px-4 py-3",
                        // LIGHT: stronger orange ring
                        "bg-primary/8 border-primary/25",
                        // DARK
                        "dark:bg-primary/10 dark:border-primary/20",
                      )}
                    >
                      <p className="font-semibold text-sm text-foreground">
                        {selected.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getMuscleLabel(selected)}
                      </p>
                    </motion.div>

                    {/* Sets / Reps / Rest */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">ست</Label>
                        <Input
                          type="number"
                          min={1}
                          inputMode="numeric"
                          value={sets}
                          onChange={(e) => setSets(Number(e.target.value) || 1)}
                          className={cn(
                            FIELD_CLASS,
                            NUMBER_CLASS,
                            "h-10 text-center tabular-nums",
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">تکرار</Label>
                        <Input
                          value={reps}
                          onChange={(e) => setReps(e.target.value)}
                          className={cn(FIELD_CLASS, "h-10 text-center")}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">استراحت (ث)</Label>
                        <Input
                          type="number"
                          min={0}
                          inputMode="numeric"
                          value={restSeconds}
                          onChange={(e) =>
                            setRestSeconds(Number(e.target.value) || 0)
                          }
                          className={cn(
                            FIELD_CLASS,
                            NUMBER_CLASS,
                            "h-10 text-center tabular-nums",
                          )}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelected(null)}
                        className={cn(
                          "flex-1 h-11",
                          "bg-card border-border hover:bg-muted/70 hover:border-foreground/20",
                          "dark:bg-transparent dark:border-white/15",
                          "dark:hover:bg-white/5 dark:hover:border-white/25",
                        )}
                      >
                        بازگشت
                      </Button>
                      <motion.div
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 22,
                        }}
                        className="flex-1"
                      >
                        <Button
                          type="button"
                          onClick={handleConfirmLibrary}
                          className={cn(
                            "w-full h-11 font-semibold",
                            "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25",
                            "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
                          )}
                        >
                          افزودن
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="custom"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label>نام حرکت</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="مثلاً: اسکوات هالتر"
                    className={cn(FIELD_CLASS, "h-11")}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label>عضله درگیر</Label>
                  <Input
                    value={customMuscle}
                    onChange={(e) => setCustomMuscle(e.target.value)}
                    placeholder="مثلاً: پا"
                    className={cn(FIELD_CLASS, "h-11")}
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">ست</Label>
                    <Input
                      type="number"
                      min={1}
                      inputMode="numeric"
                      value={sets}
                      onChange={(e) => setSets(Number(e.target.value) || 1)}
                      className={cn(
                        FIELD_CLASS,
                        NUMBER_CLASS,
                        "h-10 text-center tabular-nums",
                      )}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">تکرار</Label>
                    <Input
                      value={reps}
                      onChange={(e) => setReps(e.target.value)}
                      className={cn(FIELD_CLASS, "h-10 text-center")}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">استراحت (ث)</Label>
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={restSeconds}
                      onChange={(e) =>
                        setRestSeconds(Number(e.target.value) || 0)
                      }
                      className={cn(
                        FIELD_CLASS,
                        NUMBER_CLASS,
                        "h-10 text-center tabular-nums",
                      )}
                    />
                  </div>
                </div>

                <motion.div
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.99 }}
                  transition={{ type: "spring", stiffness: 400, damping: 22 }}
                >
                  <Button
                    type="button"
                    disabled={!customName.trim()}
                    onClick={handleConfirmCustom}
                    className={cn(
                      "w-full h-11 font-semibold",
                      "shadow-sm shadow-primary/20 hover:shadow-md hover:shadow-primary/25",
                      "dark:shadow-none dark:hover:shadow-lg dark:hover:shadow-primary/30",
                    )}
                  >
                    افزودن حرکت سفارشی
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </SheetContent>
    </Sheet>
  );
}
