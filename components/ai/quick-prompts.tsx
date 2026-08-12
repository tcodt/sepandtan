"use client";

import { Button } from "@/components/ui/button";
import { Dumbbell, Apple, Scale, Flame, Heart } from "lucide-react";

const prompts = [
  { label: "برنامه تمرینی بده", icon: Dumbbell },
  { label: "رژیم غذایی پیشنهادی", icon: Apple },
  { label: "چطور وزن کم کنم؟", icon: Scale },
  { label: "تمرین خانگی بدون تجهیزات", icon: Flame },
  { label: "تقویت میان‌تنه", icon: Heart },
];

type QuickPromptsProps = {
  onSelect: (text: string) => void;
  disabled?: boolean;
};

export function QuickPrompts({ onSelect, disabled }: QuickPromptsProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {prompts.map((item) => {
        const Icon = item.icon;
        return (
          <Button
            key={item.label}
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full gap-1.5 text-xs sm:text-sm h-8"
            disabled={disabled}
            onClick={() => onSelect(item.label)}
          >
            <Icon className="w-3.5 h-3.5" />
            {item.label}
          </Button>
        );
      })}
    </div>
  );
}
