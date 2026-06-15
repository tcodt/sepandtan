"use client";

import { Button } from "@/components/ui/button";

const categories = [
  { id: "all", name: "همه" },
  { id: "apparel", name: "لباس ورزشی" },
  { id: "equipment", name: "تجهیزات" },
  { id: "nutrition", name: "مکمل‌ها" },
];

interface CategoryProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const Category = ({ selectedCategory, onCategoryChange }: CategoryProps) => {
  return (
    <div className="mt-4 flex items-center flex-row flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          size={"sm"}
          variant={selectedCategory === category.id ? "default" : "outline"}
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

export default Category;
