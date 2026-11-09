"use client";

import { ArrowDownUp } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { CategorySelectorItem } from "@/features/catalog/types";
import type { ProductSort } from "@/features/products/types";

type Props = {
  categories: CategorySelectorItem[];
  selectedCategoryId: string | "all";
  onCategoryChange: (id: string | "all") => void;
  sort?: ProductSort;
  onSortChange?: (sort: ProductSort) => void;
};

const SORT_OPTIONS: Array<{ value: ProductSort; label: string }> = [
  { value: "newest", label: "جدیدترین" },
  { value: "oldest", label: "قدیمی‌ترین" },
  { value: "popular", label: "محبوب‌ترین" },
  { value: "price_asc", label: "ارزان‌ترین" },
  { value: "price_desc", label: "گران‌ترین" },
  { value: "rating", label: "بیشترین امتیاز" },
];

export default function CategoryFilter({
  categories,
  selectedCategoryId,
  onCategoryChange,
  sort = "newest",
  onSortChange,
}: Props) {
  const safeSort: ProductSort = SORT_OPTIONS.some((o) => o.value === sort)
    ? (sort as ProductSort)
    : "newest";

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative -mx-1 min-w-0 flex-1">
        <div
          className="pointer-events-none absolute inset-y-0 inset-s-0 z-10 w-4 bg-gradient-to-e from-background to-transparent"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 inset-e-0 z-10 w-4 bg-gradient-to-s from-background to-transparent"
          aria-hidden
        />

        <div
          className={cn(
            "flex items-center gap-2 overflow-x-auto px-1 pb-1",
            "scrollbar-none [&::-webkit-scrollbar]:hidden",
          )}
          role="tablist"
          aria-label="دسته‌بندی محصولات"
        >
          <CategoryChip
            label="همه"
            active={selectedCategoryId === "all"}
            onClick={() => onCategoryChange("all")}
          />
          {categories.map((c) => (
            <CategoryChip
              key={c.id}
              label={c.name}
              active={selectedCategoryId === c.id}
              onClick={() => onCategoryChange(c.id)}
            />
          ))}
        </div>
      </div>

      {onSortChange && (
        <div className="w-full shrink-0 sm:w-44">
          <Select
            value={safeSort}
            onValueChange={(v) => onSortChange(v as ProductSort)}
          >
            <SelectTrigger
              dir="rtl"
              className="h-10 w-full rounded-xl bg-background"
              aria-label="مرتب‌سازی محصولات"
            >
              <span className="flex items-center gap-2 text-xs">
                <ArrowDownUp
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <SelectValue placeholder="مرتب‌سازی" />
              </span>
            </SelectTrigger>
            <SelectContent dir="rtl">
              {SORT_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

function CategoryChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs font-medium",
        "transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        active
          ? "border-primary bg-primary text-primary-foreground shadow-sm"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
