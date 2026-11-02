"use client";

import Image from "next/image";
import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductListItem } from "@/features/products/types";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  const image =
    product.images[0]?.url ||
    product.images[0]?.path ||
    "/images/placeholder-product.png";

  const price = product.minPrice ?? product.originalPrice;
  const inStock = product.status === "APPROVED"; // یا بر اساس موجودی واریانت اگر بعداً آمد

  return (
    <Card
      className={cn(
        "group overflow-hidden border-border bg-card/80",
        "rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5",
      )}
    >
      <Link href={`/store/${product.slug}`} className="block">
        <div className="relative aspect-square bg-muted/40 overflow-hidden">
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {product.isFeatured && (
            <Badge className="absolute top-2 right-2 text-[10px]">ویژه</Badge>
          )}
          {product.discountPercent != null && product.discountPercent > 0 && (
            <Badge
              variant="secondary"
              className="absolute top-2 left-2 text-[10px]"
            >
              ٪{product.discountPercent.toLocaleString("fa-IR")}-
            </Badge>
          )}
          <Badge
            variant="outline"
            className="absolute bottom-2 left-2 bg-background/90 text-[10px]"
          >
            {product.category.name}
          </Badge>
        </div>
      </Link>

      <CardContent className="p-3 sm:p-4 space-y-2">
        <Link href={`/store/${product.slug}`}>
          <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary">
            {product.title}
          </h3>
        </Link>
        {product.brand?.name && (
          <p className="text-[11px] text-muted-foreground">
            {product.brand.name}
          </p>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{product.rating}</span>
          <span className="text-border">·</span>
          <span>{product.reviewCount.toLocaleString("fa-IR")} نظر</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold tabular-nums">
            {price != null ? `${price.toLocaleString("fa-IR")} تومان` : "—"}
          </p>
          {!inStock && (
            <span className="text-[10px] text-muted-foreground">ناموجود</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
