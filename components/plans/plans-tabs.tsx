"use client";

import { cn } from "@/lib/utils";

export type PlansTab = "active" | "all" | "expired";

const TABS: { id: PlansTab; label: string }[] = [
  { id: "active", label: "فعال" },
  { id: "all", label: "همه" },
  { id: "expired", label: "منقضی" },
];

type Props = {
  value: PlansTab;
  onChange: (tab: PlansTab) => void;
  counts?: Partial<Record<PlansTab, number>>;
};

export function PlansTabs({ value, onChange, counts }: Props) {
  return (
    <div
      role="tablist"
      aria-label="فیلتر برنامه‌ها"
      className="flex gap-1 p-1 rounded-2xl border border-border bg-muted/40 backdrop-blur-sm"
    >
      {TABS.map((tab) => {
        const selected = value === tab.id;
        const count = counts?.[tab.id];

        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 relative rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {typeof count === "number" && count > 0 && (
              <span
                className={cn(
                  "ms-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full text-[11px]",
                  selected
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
