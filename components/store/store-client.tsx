"use client";

import { useMemo, useState } from "react";
import { Search, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/products-type";
import Category from "./category";
import ProductGrid from "./product-grid";

type StoreClientProps = {
  initialItems: Product[];
};

export default function StoreClient({ initialItems }: StoreClientProps) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    let list =
      selectedCategory === "all"
        ? initialItems
        : initialItems.filter((item) => item.category === selectedCategory);

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q),
      );
    }
    return list;
  }, [initialItems, selectedCategory, query]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-16 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                فروشگاه
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {filteredItems.length.toLocaleString("fa-IR")} محصول
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="جستجوی محصول..."
              className="h-11 pr-10 rounded-xl"
            />
          </div>

          <Category
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <ProductGrid items={filteredItems} />
      </div>
    </div>
  );
}
