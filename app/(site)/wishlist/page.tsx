"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Loader2,
  Trash2,
  PackageOpen,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  ShoppingBag,
} from "lucide-react";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { useToggleWishlist, useWishlistPage } from "@/features/wishlist/hooks";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/* -------------------------------------------------------------------------- */
/* Skeleton card                                                              */
/* -------------------------------------------------------------------------- */

function WishlistSkeletonCard() {
  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card">
      <CardContent className="flex gap-3 p-3">
        <Skeleton className="h-28 w-28 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty / Error                                                              */
/* -------------------------------------------------------------------------- */

function WishlistEmptyState() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
          <PackageOpen
            className="h-7 w-7 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            هنوز محصولی به علاقه‌مندی‌ها اضافه نکرده‌اید
          </h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            محصولات موردعلاقه‌تان را ذخیره کنید تا بعداً راحت‌تر پیدایشان کنید.
          </p>
        </div>
        <Button asChild size="sm">
          <Link href="/store">
            <ShoppingBag className="me-1.5 h-4 w-4" aria-hidden="true" />
            مشاهده فروشگاه
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function WishlistErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10">
          <AlertTriangle
            className="h-7 w-7 text-destructive"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            بارگذاری علاقه‌مندی‌ها ناموفق بود
          </h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            اتصال خود را بررسی کنید یا دوباره تلاش کنید.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
          تلاش دوباره
        </Button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function WishlistPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: false,
  });

  const [page, setPage] = useState(1);
  const { data, isLoading, isFetching, isError, refetch } = useWishlistPage(
    page,
    isAuthenticated,
  );
  const toggle = useToggleWishlist();

  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const pageSize = Math.max(items.length, 10);
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2
            className="h-8 w-8 animate-spin text-primary"
            aria-hidden="true"
          />
          <p className="text-xs text-muted-foreground">در حال بارگذاری…</p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-muted/30 dark:bg-background">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* ------------------------------ Header --------------------------- */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-xl font-bold sm:text-2xl">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500/10 text-rose-500">
                <Heart className="h-4 w-4 fill-current" aria-hidden="true" />
              </span>
              علاقه‌مندی‌ها
              {total > 0 && (
                <Badge
                  variant="secondary"
                  className="h-6 rounded-full px-2 text-xs tabular-nums"
                  aria-live="polite"
                >
                  {total.toLocaleString("fa-IR")}
                </Badge>
              )}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              محصولاتی که برای خرید بعدی ذخیره کرده‌اید
              {isFetching && (
                <span className="ms-1 inline-flex items-center gap-1">
                  <Loader2 className="inline h-3 w-3 animate-spin" />
                  در حال به‌روزرسانی…
                </span>
              )}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetch()}
            disabled={isFetching}
            className="shrink-0"
          >
            {isFetching ? (
              <Loader2
                className="me-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
            )}
            بروزرسانی
          </Button>
        </header>

        {/* ------------------------------ Body ----------------------------- */}
        {isLoading ? (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i}>
                <WishlistSkeletonCard />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <WishlistErrorState onRetry={() => void refetch()} />
        ) : items.length === 0 ? (
          <WishlistEmptyState />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const p = item.product;
              const price = p.minPrice ?? p.originalPrice;
              const removing =
                toggle.isPending &&
                toggle.variables?.productId === p.id &&
                toggle.variables?.isInWishlist === true;

              return (
                <li key={item.id}>
                  <Card className="group h-full overflow-hidden rounded-2xl border-border bg-card transition-colors hover:border-primary/30">
                    <CardContent className="flex gap-3 p-3">
                      <Link
                        href={`/store/${p.slug}`}
                        className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-muted/40"
                        aria-label={`مشاهده ${p.title}`}
                      >
                        {p.imageUrl ? (
                          <Image
                            src={p.imageUrl}
                            alt={p.title}
                            fill
                            className="object-contain p-1.5 transition-transform duration-200 motion-reduce:transition-none group-hover:scale-105"
                            sizes="112px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <PackageOpen
                              className="h-8 w-8"
                              aria-hidden="true"
                            />
                          </div>
                        )}
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <Link
                          href={`/store/${p.slug}`}
                          className="line-clamp-2 text-sm font-semibold text-foreground hover:text-primary"
                          title={p.title}
                        >
                          {p.title}
                        </Link>

                        {p.brand?.name && (
                          <p className="truncate text-[11px] text-muted-foreground">
                            {p.brand.name}
                          </p>
                        )}

                        <p className="text-sm font-bold tabular-nums text-foreground">
                          {price != null
                            ? `${price.toLocaleString("fa-IR")} تومان`
                            : "استعلام قیمت"}
                        </p>

                        <div className="mt-auto flex items-center gap-1.5 pt-1.5">
                          <Button
                            asChild
                            size="sm"
                            variant="secondary"
                            className="h-8 flex-1"
                          >
                            <Link href={`/store/${p.slug}`}>مشاهده</Link>
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            disabled={removing}
                            onClick={() =>
                              toggle.mutate({
                                productId: p.id,
                                isInWishlist: true,
                              })
                            }
                            aria-label={`حذف ${p.title} از علاقه‌مندی‌ها`}
                          >
                            {removing ? (
                              <Loader2
                                className="h-4 w-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}

        {/* --------------------------- Pagination -------------------------- */}
        {totalPages > 1 && items.length > 0 && !isLoading && !isError && (
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-start">
              صفحه {page.toLocaleString("fa-IR")} از{" "}
              {totalPages.toLocaleString("fa-IR")}
            </p>
            <div className="order-1 flex gap-2 sm:order-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1 || isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-9 flex-1 sm:flex-none"
              >
                <ChevronRight
                  className="me-1 h-4 w-4 sm:hidden"
                  aria-hidden="true"
                />
                <ChevronLeft
                  className="me-1 hidden h-4 w-4 sm:inline"
                  aria-hidden="true"
                />
                قبلی
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page >= totalPages || isFetching}
                onClick={() => setPage((p) => p + 1)}
                className="h-9 flex-1 sm:flex-none"
              >
                بعدی
                <ChevronLeft
                  className="ms-1 h-4 w-4 sm:hidden"
                  aria-hidden="true"
                />
                <ChevronRight
                  className="ms-1 hidden h-4 w-4 sm:inline"
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
