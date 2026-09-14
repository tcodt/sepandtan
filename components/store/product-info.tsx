"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Product } from "@/lib/products-type";
import { isApparelProduct } from "@/lib/products-type";
import AddToCart from "./add-to-cart";

export default function ProductInfo({ product }: { product: Product }) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const sizes = isApparelProduct(product) ? product.sizes : undefined;

  return (
    <Card className="p-5 sm:p-6 rounded-2xl border-border bg-card/80 dark:bg-card/60 space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {product.name}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
          {product.description}
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        <span className="font-medium">{product.rating}</span>
        <span className="text-muted-foreground">
          ({product.reviews.toLocaleString("fa-IR")} نظر)
        </span>
      </div>

      <div className="text-2xl sm:text-3xl font-bold text-primary tabular-nums">
        {product.price.toLocaleString("fa-IR")}{" "}
        <span className="text-sm font-normal text-muted-foreground">تومان</span>
      </div>

      <div>
        {product.inStock ? (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20">
            موجود در انبار
          </Badge>
        ) : (
          <Badge variant="destructive">ناموجود</Badge>
        )}
      </div>

      {sizes && sizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">انتخاب سایز</h3>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => (
              <Button
                key={size}
                type="button"
                size="sm"
                variant={selectedSize === size ? "default" : "outline"}
                className="rounded-full min-w-10"
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      <AddToCart product={product} size={selectedSize} />
    </Card>
  );
}
