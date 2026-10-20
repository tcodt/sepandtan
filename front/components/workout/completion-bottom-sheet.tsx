"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  durationMinutes?: number;
  estimatedCalories?: number;
  onComplete: (data: { difficulty?: number; note?: string }) => void;
};

export function CompletionBottomSheet({
  open,
  onOpenChange,
  durationMinutes = 0,
  estimatedCalories = 0,
  onComplete,
}: Props) {
  const [difficulty, setDifficulty] = useState<number | undefined>(undefined);
  const [note, setNote] = useState("");

  const handleClose = () => {
    onComplete({
      difficulty,
      note: note.trim() || undefined,
    });
    onOpenChange(false);
    setDifficulty(undefined);
    setNote("");
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-w-lg mx-auto">
        <DrawerHeader className="text-center sm:text-center">
          <DrawerTitle className="text-xl">
            آفرین! تمرین امروز تموم شد
          </DrawerTitle>
          <DrawerDescription className="text-sm">
            حدود {durationMinutes.toLocaleString("fa-IR")} دقیقه • تقریباً{" "}
            {estimatedCalories.toLocaleString("fa-IR")} کالری
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 space-y-5 pb-2">
          {/* Difficulty */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground text-center">
              چقدر سخت بود؟
            </p>
            <div
              className="flex items-center justify-center gap-2"
              role="group"
              aria-label="امتیاز سختی"
            >
              {[1, 2, 3, 4, 5].map((value) => {
                const active = difficulty !== undefined && value <= difficulty;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDifficulty(value)}
                    className={cn(
                      "p-2 rounded-lg transition-colors min-w-11 min-h-11 flex items-center justify-center",
                      active
                        ? "text-amber-500"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                    aria-label={`${value} از ۵`}
                    aria-pressed={difficulty === value}
                  >
                    <Star
                      className={cn("w-7 h-7", active && "fill-amber-500")}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional note */}
          <div className="space-y-1.5">
            <label htmlFor="workout-note" className="sr-only">
              یادداشت اختیاری
            </label>
            <textarea
              id="workout-note"
              value={note}
              onChange={(e) => {
                if (e.target.value.length <= 200) setNote(e.target.value);
              }}
              placeholder="یادداشتی داری؟ (اختیاری)"
              rows={2}
              className={cn(
                "w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm",
                "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
                "resize-none",
              )}
              maxLength={200}
            />
          </div>
        </div>

        <DrawerFooter>
          <Button
            type="button"
            size="lg"
            className="w-full h-12 text-base font-semibold"
            onClick={handleClose}
          >
            عالی، تمام شد
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
