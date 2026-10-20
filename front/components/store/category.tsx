"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const categories = [
  { id: "all", name: "همه" },
  { id: "apparel", name: "لباس ورزشی" },
  { id: "equipment", name: "تجهیزات" },
  { id: "nutrition", name: "مکمل‌ها" },
];

type CategoryProps = {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
};

export default function Category({
  selectedCategory,
  onCategoryChange,
}: CategoryProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {categories.map((category) => {
        const active = selectedCategory === category.id;
        return (
          <Button
            key={category.id}
            size="sm"
            variant={active ? "default" : "outline"}
            onClick={() => onCategoryChange(category.id)}
            className={cn("rounded-full shrink-0", active && "shadow-sm")}
          >
            {category.name}
          </Button>
        );
      })}
    </div>
  );
}
