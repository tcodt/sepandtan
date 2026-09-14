"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@/lib/products-type";
import { cn } from "@/lib/utils";

const categoryLabels: Record<string, string> = {
  apparel: "لباس ورزشی",
  equipment: "تجهیزات",
  nutrition: "مکمل",
};

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card
      className={cn(
        "group overflow-hidden border-border bg-card/80 dark:bg-card/60",
        "rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      <Link href={`/store/${product.id}`} className="block">
        <div className="relative aspect-square bg-muted/40 overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {!product.inStock && (
            <Badge
              variant="secondary"
              className="absolute top-2 right-2 bg-background/90"
            >
              ناموجود
            </Badge>
          )}

          <Badge
            variant="outline"
            className="absolute top-2 left-2 bg-background/90 text-[10px]"
          >
            {categoryLabels[product.category] ?? product.category}
          </Badge>
        </div>
      </Link>

      <CardContent className="p-3 sm:p-4 space-y-2.5">
        <div>
          <Link href={`/store/${product.id}`}>
            <h3 className="text-sm font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{product.rating}</span>
          <span className="text-border">·</span>
          <span>{product.reviews.toLocaleString("fa-IR")} نظر</span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <p className="text-sm font-bold text-foreground tabular-nums">
            {product.price.toLocaleString("fa-IR")}
            <span className="text-[11px] font-normal text-muted-foreground mr-1">
              تومان
            </span>
          </p>

          <Button
            asChild
            size="sm"
            className="rounded-full h-8 px-3 gap-1.5"
            disabled={!product.inStock}
          >
            <Link href={`/store/${product.id}`}>
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مشاهده</span>
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
