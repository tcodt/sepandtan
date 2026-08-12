"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MealItem } from "@/lib/data/nutrition";
import { Check } from "lucide-react";

type ReplaceMealSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  alternatives: MealItem[];
  selectedId: string;
  onSelect: (mealId: string) => void;
};

export function ReplaceMealSheet({
  open,
  onOpenChange,
  label,
  alternatives,
  selectedId,
  onSelect,
}: ReplaceMealSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh]">
        <SheetHeader className="text-right">
          <SheetTitle>جایگزین برای {label}</SheetTitle>
          <SheetDescription>یکی از گزینه‌های زیر را انتخاب کن</SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2 px-4 pb-6 overflow-y-auto">
          {alternatives.map((item) => {
            const active = item.id === selectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelect(item.id);
                  onOpenChange(false);
                }}
                className={cn(
                  "w-full text-right rounded-xl border p-4 transition-all",
                  active
                    ? "border-primary bg-primary/10"
                    : "border-border bg-background hover:bg-muted/50",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        active ? "text-primary" : "text-foreground",
                      )}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {item.calories.toLocaleString("fa-IR")} کالری
                    </p>
                  </div>
                  {active && (
                    <Check className="w-5 h-5 text-primary shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="px-4 pb-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            بستن
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
