"use client";

import type { Product } from "@/lib/products-type";
import { ProductCard } from "./product-card";

type ProductGridProps = {
  items: Product[];
};

export default function ProductGrid({ items }: ProductGridProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border py-16 text-center">
        <p className="text-sm text-muted-foreground">
          محصولی در این دسته پیدا نشد
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((item) => (
        <ProductCard key={item.id} product={item} />
      ))}
    </div>
  );
}
