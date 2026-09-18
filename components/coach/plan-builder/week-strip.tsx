"use client";

import { Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanDay } from "@/lib/types/plan";

type Props = {
  days: PlanDay[];
  selectedDay: number;
  onSelect: (dayNumber: number) => void;
  onToggleRest: (dayNumber: number) => void;
};

export function WeekStrip({
  days,
  selectedDay,
  onSelect,
  onToggleRest,
}: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
      {days.map((day) => {
        const isSelected = day.dayNumber === selectedDay;
        const exerciseCount = day.exercises.length;

        return (
          <button
            key={day.dayNumber}
            type="button"
            onClick={() => onSelect(day.dayNumber)}
            onDoubleClick={() => onToggleRest(day.dayNumber)}
            className={cn(
              "relative flex flex-col items-center justify-center min-w-16 h-16 rounded-2xl border transition-all",
              isSelected
                ? "bg-primary/20 border-primary text-primary"
                : "bg-white/5 border-white/10 text-muted-foreground hover:bg-white/10",
            )}
            title="دوبار کلیک = تغییر به روز استراحت"
          >
            <span className="text-[11px] font-medium">روز {day.dayNumber}</span>

            {day.isRestDay ? (
              <Moon className="w-4 h-4 mt-1 opacity-80" />
            ) : (
              <span className="text-xs mt-1">
                {exerciseCount > 0 ? `${exerciseCount} حرکت` : "—"}
              </span>
            )}

            {isSelected && (
              <span className="absolute -bottom-1 w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
