"use client";

import { cn } from "@/lib/utils";
import { ACCESS_DURATION_OPTIONS } from "@/lib/types/access";

type Duration = 30 | 45 | 90;

type Props = {
  value: Duration;
  onChange: (days: Duration) => void;
  /** قیمت پایه برای نمایش تقریبی (اختیاری) */
  basePrice?: number;
  className?: string;
};

export function DurationSelector({
  value,
  onChange,
  basePrice,
  className,
}: Props) {
  return (
    <div className={cn("space-y-2", className)}>
      <p className="text-sm font-medium text-foreground">مدت دسترسی</p>
      <div className="grid grid-cols-3 gap-2">
        {ACCESS_DURATION_OPTIONS.map((opt) => {
          const selected = value === opt.days;
          const price =
            basePrice != null ? Math.round(basePrice * (opt.days / 30)) : null;

          return (
            <button
              key={opt.days}
              type="button"
              onClick={() => onChange(opt.days)}
              className={cn(
                "relative flex flex-col items-center justify-center gap-0.5 rounded-2xl border px-2 py-3 transition-all",
                selected
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-border bg-card/60 text-foreground hover:border-primary/40",
              )}
            >
              {opt.badge && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {opt.badge}
                </span>
              )}
              <span className="text-sm font-semibold">{opt.label}</span>
              {price != null && (
                <span className="text-[11px] opacity-80">
                  {price.toLocaleString("fa-IR")} ت
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
