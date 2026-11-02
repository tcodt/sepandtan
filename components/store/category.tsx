"use client";

import { cn } from "@/lib/utils";
import type { CategorySelectorItem } from "@/features/catalog/types";
import type { ProductListFilters } from "@/features/products/types";

type Props = {
  categories: CategorySelectorItem[];
  selectedCategoryId: string | "all";
  onCategoryChange: (id: string | "all") => void;
  sort?: ProductListFilters["sort"];
  onSortChange?: (sort: ProductListFilters["sort"]) => void;
};

const sortOptions: Array<{ value: ProductListFilters["sort"]; label: string }> =
  [
    { value: "newest", label: "جدیدترین" },
    { value: "popular", label: "محبوب" },
    { value: "price_asc", label: "ارزان‌تر" },
    { value: "price_desc", label: "گران‌تر" },
    { value: "rating", label: "امتیاز" },
  ];

export default function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
  sort = "newest",
  onSortChange,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          type="button"
          onClick={() => onCategoryChange("all")}
          className={cn(
            "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
            selectedCategoryId === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background border-border text-muted-foreground hover:border-primary/40",
          )}
        >
          همه
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onCategoryChange(c.id)}
            className={cn(
              "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
              selectedCategoryId === c.id
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border text-muted-foreground hover:border-primary/40",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {onSortChange && (
        <select
          value={sort}
          onChange={(e) =>
            onSortChange(e.target.value as ProductListFilters["sort"])
          }
          className="h-9 rounded-lg border border-border bg-background px-2 text-xs"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
