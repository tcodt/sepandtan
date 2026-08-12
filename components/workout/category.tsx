"use client";

import { Button } from "@/components/ui/button";
import React from "react";

interface CategoryProps {
  categories: {
    id: string;
    name: string;
    icon: React.ElementType;
  }[];
  onCategoryChange: (categoryId: string) => void;
  selected: string;
  filteredWorkouts: number;
}

const Category = ({
  categories,
  onCategoryChange,
  selected,
  filteredWorkouts,
}: CategoryProps) => {
  return (
    <div className="mt-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="flex items-center gap-3 flex-wrap overflow-x-hidden py-2">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = selected === cat.id;
          return (
            <Button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              variant={active ? "default" : "outline"}
            >
              <Icon
                className={`h-4 w-4 ${active ? "text-white" : "text-orange-500"}`}
              />
              <span>{cat.name}</span>
              {/* <span className="ml-2 rounded-full bg-white/20 px-2 text-xs">
                        {cat.count}
                      </span> */}
            </Button>
          );
        })}
      </div>
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {filteredWorkouts} نتیجه
      </div>
    </div>
  );
};

export default Category;
