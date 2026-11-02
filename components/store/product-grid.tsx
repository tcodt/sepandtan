"use client";

import type { ProductListItem } from "@/features/products/types";
import { ProductCard } from "./product-card";

export default function ProductGrid({ items }: { items: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
