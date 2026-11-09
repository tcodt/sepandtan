"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import {
  Loader2,
  Star,
  ShoppingBag,
  ChevronLeft,
  Truck,
  ShieldCheck,
  Package,
  AlertCircle,
  Minus,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

import { useProductDetail } from "@/features/products/hooks";
import { useProductVariants } from "@/features/variants/hooks";
import { useAddToCart } from "@/features/cart/hooks";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { resolveMediaUrl, asString, asNumber } from "@/features/catalog/utils";
import { cn } from "@/lib/utils";

import { WishlistToggle } from "./wishlist-toggle";
import { ShareMenu } from "@/components/store/share-menu";
import { ProductReviewsSection } from "./product-reviews-section";

type Props = { idOrSlug: string };

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function ProductDetailSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <Skeleton className="mb-6 h-3 w-48" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-2xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-16 rounded-xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Main                                                                       */
/* -------------------------------------------------------------------------- */

export default function ProductDetailClient({ idOrSlug }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useProductDetail(idOrSlug);

  const productId =
    asString((data as Record<string, unknown> | undefined)?.id) ?? "";

  const { data: variants = [], isLoading: variantsLoading } =
    useProductVariants(productId, Boolean(productId));

  const addToCart = useAddToCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [cartQuantity, setCartQuantity] = useState(1);

  const activeVariant = useMemo(() => {
    if (!variants.length) return null;
    if (selectedVariantId) {
      return variants.find((v) => v.id === selectedVariantId) ?? variants[0];
    }
    return variants[0];
  }, [variants, selectedVariantId]);

  const r = (data ?? {}) as Record<string, unknown>;
  const images = Array.isArray(r.images) ? r.images : [];
  const galleryUrls = images
    .map((img) => {
      const obj = img as Record<string, unknown>;
      const path = asString(obj?.url) ?? asString(obj?.path);
      return path ? resolveMediaUrl(path) : null;
    })
    .filter((u): u is string => !!u);

  const title = asString(r.title) ?? "محصول";
  const description = asString(r.description) ?? "";
  const rating = asNumber(r.rating) ?? 0;
  const reviewCount = asNumber(r.reviewCount) ?? 0;

  const price = activeVariant?.price ?? asNumber(r.minPrice);
  const quantity = activeVariant?.quantity ?? 0;
  const inStock = quantity > 0;
  const lowStock = quantity > 0 && quantity <= 3;

  if (isLoading) return <ProductDetailSkeleton />;
  if (isError || !data) notFound();

  const currentImage =
    galleryUrls[selectedImageIndex] ?? galleryUrls[0] ?? null;

  const effectiveCartQty = Math.min(cartQuantity, Math.max(1, quantity));

  const handleAdd = async () => {
    if (!isAuthenticated) {
      toast.error("برای افزودن به سبد، ابتدا وارد شوید");
      router.push(
        `/login?next=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    if (!productId || !activeVariant?.id) {
      toast.error("واریانت محصول موجود نیست");
      return;
    }
    if (quantity <= 0) {
      toast.error("این واریانت موجود نیست");
      return;
    }
    await addToCart.mutateAsync({
      productId,
      variantId: activeVariant.id,
      quantity: effectiveCartQty,
    });
    toast.success(
      `${effectiveCartQty.toLocaleString("fa-IR")} عدد به سبد اضافه شد`,
    );
    setCartQuantity(1);
  };

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 sm:py-10">
      {/* ------------------------------ Breadcrumb ------------------------- */}
      <nav
        className="mb-3 flex items-center gap-1 text-xs text-muted-foreground sm:mb-6"
        aria-label="مسیر صفحه"
      >
        <Link href="/store" className="hover:text-foreground">
          فروشگاه
        </Link>
        <ChevronLeft className="h-3 w-3" aria-hidden="true" />
        <span className="truncate text-foreground" aria-current="page">
          {title}
        </span>
      </nav>

      {/* --------------------------- Main two-col -------------------------- */}
      <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-2 lg:gap-12">
        {/* --------------------------- Gallery --------------------------- */}
        <div className="space-y-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted/40">
            {currentImage ? (
              <Image
                src={currentImage}
                alt={title}
                fill
                className="object-contain p-4 sm:p-6"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <Package className="h-12 w-12" aria-hidden="true" />
              </div>
            )}

            {!inStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                <Badge variant="destructive" className="px-4 py-2 text-sm">
                  ناموجود
                </Badge>
              </div>
            )}
          </div>

          {galleryUrls.length > 1 && (
            <div
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin"
              role="group"
              aria-label="گالری تصاویر"
            >
              {galleryUrls.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  onClick={() => setSelectedImageIndex(i)}
                  aria-label={`تصویر ${i + 1}`}
                  aria-pressed={selectedImageIndex === i}
                  className={cn(
                    "relative size-14 shrink-0 overflow-hidden rounded-xl border-2 bg-muted transition-all sm:size-16",
                    selectedImageIndex === i
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-border",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  )}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* --------------------------- Details --------------------------- */}
        <div className="space-y-5">
          {/* Title + rating */}
          <div className="space-y-2">
            <h1 className="text-xl font-bold leading-snug text-foreground sm:text-2xl lg:text-3xl">
              {title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground sm:text-sm">
              <div className="flex items-center gap-1">
                <Star
                  className="h-4 w-4 fill-amber-400 text-amber-400"
                  aria-hidden="true"
                />
                <span className="tabular-nums text-foreground">
                  {rating.toLocaleString("fa-IR", {
                    maximumFractionDigits: 1,
                  })}
                </span>
              </div>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {reviewCount.toLocaleString("fa-IR")} نظر
              </span>
            </div>
          </div>

          {description && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}

          {/* Price block */}
          <div className="rounded-xl border border-border bg-muted/20 p-3 sm:p-4">
            <p className="text-xl font-bold tabular-nums text-foreground sm:text-2xl lg:text-3xl">
              {price != null
                ? `${Number(price).toLocaleString("fa-IR")} تومان`
                : "استعلام قیمت"}
            </p>
            {inStock ? (
              <p className="mt-1 text-xs text-muted-foreground">
                <span
                  className={cn(
                    "inline-flex items-center gap-1",
                    lowStock && "text-amber-600 dark:text-amber-400",
                  )}
                >
                  {lowStock ? (
                    <>
                      <AlertCircle className="h-3 w-3" aria-hidden="true" />
                      تنها {quantity.toLocaleString("fa-IR")} عدد در انبار
                    </>
                  ) : (
                    <>
                      <Package className="h-3 w-3" aria-hidden="true" />
                      موجود در انبار
                    </>
                  )}
                </span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-destructive">
                در حال حاضر ناموجود است
              </p>
            )}
          </div>

          {/* Variants */}
          {variantsLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              در حال بارگذاری واریانت‌ها…
            </div>
          ) : variants.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">
                انتخاب واریانت
              </p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const active = (activeVariant?.id ?? "") === v.id;
                  const outOfStock = (v.quantity ?? 0) <= 0;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(v.id);
                        setCartQuantity(1);
                      }}
                      aria-pressed={active}
                      aria-disabled={outOfStock}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40",
                        outOfStock && "opacity-60",
                      )}
                    >
                      {v.color?.hexCode && (
                        <span
                          className="inline-block h-3 w-3 shrink-0 rounded-full border border-border"
                          style={{ backgroundColor: v.color.hexCode }}
                          aria-hidden="true"
                        />
                      )}
                      <span className="font-medium">{v.name}</span>
                      {v.color?.name && (
                        <span className="text-muted-foreground">
                          · {v.color.name}
                        </span>
                      )}
                      {outOfStock && (
                        <span className="text-destructive">· ناموجود</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <Badge variant="secondary" className="text-xs">
              واریانتی برای این محصول ثبت نشده
            </Badge>
          )}

          <Separator />

          {/* Actions */}
          <div className="space-y-2.5">
            {/* Quantity + add row */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              {inStock && (
                <div className="flex h-12 w-full shrink-0 items-center justify-between rounded-xl border border-border bg-background px-1 sm:w-auto">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() => setCartQuantity((q) => Math.max(1, q - 1))}
                    disabled={cartQuantity <= 1 || addToCart.isPending}
                    aria-label="کاهش تعداد"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span
                    className="min-w-10 text-center text-base font-semibold tabular-nums text-foreground"
                    aria-live="polite"
                  >
                    {effectiveCartQty.toLocaleString("fa-IR")}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0"
                    onClick={() =>
                      setCartQuantity((q) =>
                        Math.min(quantity, Math.max(1, q + 1)),
                      )
                    }
                    disabled={cartQuantity >= quantity || addToCart.isPending}
                    aria-label="افزایش تعداد"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <Button
                size="lg"
                className="h-12 w-full rounded-xl text-sm font-semibold sm:flex-1"
                disabled={!activeVariant || !inStock || addToCart.isPending}
                onClick={handleAdd}
                aria-busy={addToCart.isPending}
              >
                {addToCart.isPending ? (
                  <>
                    <Loader2 className="me-2 h-5 w-5 animate-spin" />
                    در حال افزودن…
                  </>
                ) : !inStock ? (
                  "ناموجود"
                ) : (
                  <>
                    <ShoppingBag className="me-2 h-5 w-5" aria-hidden="true" />
                    افزودن به سبد خرید
                  </>
                )}
              </Button>
            </div>

            {/* Secondary actions */}
            <div className="flex gap-2">
              <WishlistToggle productId={productId} size="md" />
              <ShareMenu
                url={shareUrl}
                title={title}
                text={description.slice(0, 120)}
              />
            </div>
          </div>

          {/* Trust row */}
          <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
              <Truck
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              ارسال سریع به سراسر کشور
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-3 text-xs text-muted-foreground">
              <ShieldCheck
                className="h-4 w-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              ضمانت اصالت کالا
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------- Reviews --------------------------- */}
      {productId && (
        <div className="mt-10 sm:mt-14">
          <ProductReviewsSection productId={productId} />
        </div>
      )}
    </div>
  );
}
