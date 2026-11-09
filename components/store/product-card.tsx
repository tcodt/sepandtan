"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Star, Package, ShoppingBag, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { WishlistToggle } from "@/components/store/wishlist-toggle";
import type { ProductListItem } from "@/features/products/types";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: ProductListItem;
  onAddToCart?: (product: ProductListItem) => Promise<void> | void;
};

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const image = product.images[0]?.url || product.images[0]?.path || null;

  const price = product.minPrice ?? product.originalPrice;
  const originalPrice = product.originalPrice;
  const hasDiscount =
    price != null && originalPrice != null && originalPrice > price;
  const discountPercent =
    product.discountPercent != null && product.discountPercent > 0
      ? product.discountPercent
      : hasDiscount && originalPrice && price != null
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : null;

  const status = product.status.toUpperCase();
  const inStock = status === "ACTIVE" || status === "APPROVED";
  const productHref = `/store/${product.slug}`;
  const hasRating = product.reviewCount > 0;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inStock || adding) return;

    if (!onAddToCart) {
      router.push(productHref);
      return;
    }

    setAdding(true);
    try {
      await onAddToCart(product);
      toast.success("به سبد خرید اضافه شد");
    } catch {
      toast.error("افزودن به سبد ناموفق بود");
    } finally {
      setAdding(false);
    }
  };

  return (
    <article
      className={cn(
        "group flex h-full flex-col",
        "rounded-2xl bg-card shadow-sm",
        "border border-border",
        "transition-all duration-300 motion-reduce:transition-none",
        inStock ? "hover:shadow-lg hover:border-primary/25" : "opacity-90",
      )}
    >
      {/* ================================ Image tile ========================= */}
      {/* Self-contained rounded tile. Image fills it edge-to-edge (object-cover),
          so rounded corners are truly visible. Badges + wishlist float inside. */}
      <div className="relative m-2 mb-0 aspect-square overflow-hidden rounded-xl bg-muted">
        <Link
          href={productHref}
          aria-label={`مشاهده ${product.title}`}
          className="absolute inset-0 z-0"
        >
          {image ? (
            <Image
              src={image}
              alt={product.title}
              fill
              className={cn(
                "object-cover transition-transform duration-500 ease-out",
                "motion-reduce:transition-none",
                inStock && "group-hover:scale-105",
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Package
                className="h-10 w-10 text-muted-foreground/50"
                aria-hidden="true"
              />
            </div>
          )}
        </Link>

        {/* Out-of-stock veil */}
        {!inStock && (
          <div className="pointer-events-none absolute inset-0 z-10 bg-background/55 backdrop-blur-[1px]" />
        )}

        {/* Discount ribbon — top-start */}
        {discountPercent != null && discountPercent > 0 && (
          <div className="pointer-events-none absolute inset-s-0 top-3 z-20">
            <div className="rounded-e-full bg-destructive px-3 py-1 text-[11px] font-bold text-destructive-foreground shadow-md tabular-nums">
              {discountPercent.toLocaleString("fa-IR")}٪-
            </div>
          </div>
        )}

        {/* Wishlist — top-end, circular */}
        <div className="absolute inset-e-2 top-2 z-20">
          <WishlistToggle productId={product.id} />
        </div>

        {/* Featured — bottom-start pill */}
        {product.isFeatured && (
          <div className="pointer-events-none absolute bottom-2 inset-s-2 z-20">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-semibold text-white shadow-md">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              ویژه
            </span>
          </div>
        )}

        {/* Out-of-stock label */}
        {!inStock && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <span className="rounded-full bg-background/95 px-4 py-1.5 text-xs font-semibold text-muted-foreground shadow-md backdrop-blur-sm">
              ناموجود
            </span>
          </div>
        )}
      </div>

      {/* ================================ Body =============================== */}
      <div className="flex flex-1 flex-col p-3">
        {/* Brand */}
        <p
          className="mb-0.5 h-4 truncate text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
          title={product.brand?.name || undefined}
        >
          {product.brand?.name?.trim() || "\u00A0"}
        </p>

        {/* Title */}
        <Link href={productHref} className="block">
          <h3
            className="line-clamp-2 h-10 text-sm font-semibold leading-5 text-foreground transition-colors group-hover:text-primary"
            title={product.title}
          >
            {product.title}
          </h3>
        </Link>

        {/* Rating */}
        <div className="mt-1 h-4">
          {hasRating ? (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Star
                className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400"
                aria-hidden="true"
              />
              <span className="font-semibold tabular-nums text-foreground">
                {product.rating.toLocaleString("fa-IR", {
                  maximumFractionDigits: 1,
                })}
              </span>
              <span className="text-border" aria-hidden="true">
                ·
              </span>
              <span className="tabular-nums">
                {product.reviewCount.toLocaleString("fa-IR")}
              </span>
            </div>
          ) : null}
        </div>

        {/* Price */}
        <div className="mt-auto pt-2">
          {hasDiscount && originalPrice != null && (
            <div className="text-[11px] tabular-nums text-muted-foreground/70 line-through">
              {originalPrice.toLocaleString("fa-IR")}
            </div>
          )}
          <div
            className={cn(
              "text-[15px] font-bold leading-tight tabular-nums",
              inStock ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {price != null ? (
              <>
                {price.toLocaleString("fa-IR")}
                <span className="ms-1 text-[11px] font-normal text-muted-foreground">
                  تومان
                </span>
              </>
            ) : (
              <span className="text-sm font-medium text-muted-foreground">
                استعلام قیمت
              </span>
            )}
          </div>
        </div>

        {/* CTA — compact, in-body */}
        <Button
          type="button"
          size="sm"
          onClick={handleAdd}
          disabled={!inStock || adding}
          aria-label={
            inStock
              ? `افزودن ${product.title} به سبد`
              : `${product.title} ناموجود است`
          }
          aria-busy={adding}
          className={cn(
            "mt-2.5 h-8 w-full gap-1.5 rounded-lg text-xs font-medium",
            inStock
              ? "bg-primary text-background hover:bg-primary/90"
              : "bg-muted text-muted-foreground",
          )}
        >
          {adding ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              در حال افزودن…
            </>
          ) : !inStock ? (
            "ناموجود"
          ) : (
            <>
              <ShoppingBag className="h-3 w-3" aria-hidden="true" />
              افزودن
            </>
          )}
        </Button>
      </div>
    </article>
  );
}
