/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Star } from "lucide-react";

export default function ProductInfo({ product }: any) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);

  return (
    <Card className="p-6 rounded-2xl shadow-md space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-muted-foreground mt-2">{product.description}</p>
      </div>

      {/* Rating */}
      <div className="flex items-center gap-2">
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{product.rating}</span>
        <span className="text-muted-foreground text-sm">
          ({product.reviews} نظر)
        </span>
      </div>

      {/* Price */}
      <div className="text-3xl font-bold text-primary">
        {product.price.toLocaleString()} تومان
      </div>

      {/* Stock */}
      <div>
        {product.inStock ? (
          <Badge className="bg-green-500">موجود در انبار</Badge>
        ) : (
          <Badge variant="destructive">ناموجود</Badge>
        )}
      </div>

      {/* Sizes (for apparel only) */}
      {product.sizes && (
        <div>
          <h3 className="font-medium mb-2">انتخاب سایز</h3>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size: string) => (
              <Button
                key={size}
                variant={selectedSize === size ? "default" : "outline"}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Add to Cart */}
      <Button
        size="lg"
        className="w-full text-lg rounded-xl"
        disabled={!product.inStock}
      >
        افزودن به سبد خرید
      </Button>
    </Card>
  );
}
