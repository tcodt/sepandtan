"use client";

import { cn } from "@/lib/utils";
import { isValidHex, normalizeHex } from "./color-math";
import { PRESET_GROUPS } from "./preset-colors";

export function PresetSwatches({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (hex: string) => void;
  disabled?: boolean;
}) {
  const current = isValidHex(value) ? normalizeHex(value) : "";

  return (
    <div className="space-y-3">
      {PRESET_GROUPS.map((group) => (
        <div key={group.label} className="space-y-1.5">
          <p className="text-[11px] font-medium text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {group.colors.map((c) => {
              const selected = current === c.toLowerCase();
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => !disabled && onChange(c)}
                  disabled={disabled}
                  aria-label={`انتخاب رنگ ${c}`}
                  aria-pressed={selected}
                  className={cn(
                    "h-7 w-7 rounded-md border transition-transform duration-150",
                    "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                    selected
                      ? "border-foreground ring-2 ring-primary/40 ring-offset-1 ring-offset-background"
                      : "border-border",
                    disabled && "pointer-events-none opacity-50",
                  )}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
