"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Search,
  ShoppingBag,
  Loader2,
  X,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Heart,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

import { useProducts } from "@/features/products/hooks";
import { useCategorySelector } from "@/features/catalog/categories/hooks";
import type {
  ProductListFilters,
  ProductSort,
} from "@/features/products/types";

import ProductGrid from "./product-grid";
import CategoryFilter from "./category";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 12;

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Card
          key={i}
          className="overflow-hidden rounded-2xl border-border bg-card"
        >
          <Skeleton className="aspect-square w-full" />
          <CardContent className="space-y-2 p-3">
            <Skeleton className="h-2.5 w-1/3" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Filter pill                                                                */
/* -------------------------------------------------------------------------- */

function FilterPill({
  label,
  onRemove,
  ariaLabel,
}: {
  label: string;
  onRemove: () => void;
  ariaLabel: string;
}) {
  return (
    <Badge
      variant="secondary"
      className="h-7 shrink-0 gap-1 rounded-full ps-2.5 pe-1 text-[11px] font-normal"
    >
      <span className="max-w-32 truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/15 hover:text-foreground"
        aria-label={ariaLabel}
      >
        <X className="h-2.5 w-2.5" aria-hidden="true" />
      </button>
    </Badge>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty / Error                                                              */
/* -------------------------------------------------------------------------- */

function EmptyState({
  hasFilters,
  onClear,
}: {
  hasFilters: boolean;
  onClear: () => void;
}) {
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
          <ShoppingBag
            className="h-7 w-7 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            محصولی یافت نشد
          </h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            {hasFilters
              ? "با فیلترهای فعلی محصولی پیدا نشد. فیلترها را تغییر دهید یا پاک کنید."
              : "به‌محض افزودن محصول توسط فروشندگان، اینجا نمایش داده می‌شوند."}
          </p>
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={onClear}>
            <Sparkles className="me-2 h-4 w-4" aria-hidden="true" />
            پاک کردن فیلترها
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
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
            خطا در دریافت محصولات
          </h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            اتصال خود را بررسی کنید یا دوباره تلاش کنید.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
          تلاش مجدد
        </Button>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function StoreClient() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
    "all",
  );
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ProductSort>("newest");

  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const filters: ProductListFilters = useMemo(
    () => ({
      category: selectedCategoryId === "all" ? undefined : selectedCategoryId,
      sort,
      page,
      limit: PAGE_SIZE,
    }),
    [selectedCategoryId, sort, page],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useProducts(filters);
  const { data: categories = [] } = useCategorySelector(false);

  const products = useMemo(() => data?.products ?? [], [data?.products]);
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);

  const hasNextPage =
    data?.pagination.nextPage != null
      ? data.pagination.nextPage > page || data.pagination.nextPage === page + 1
      : page < totalPages;

  const visible = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q) ||
        (p.brand?.name?.toLowerCase().includes(q) ?? false),
    );
  }, [products, debouncedQuery]);

  const hasActiveFilter =
    selectedCategoryId !== "all" || debouncedQuery.length > 0;

  const activeCategory = useMemo(
    () => categories.find((c) => c.id === selectedCategoryId),
    [categories, selectedCategoryId],
  );

  const clearFilters = () => {
    setSelectedCategoryId("all");
    setQuery("");
    setDebouncedQuery("");
    setPage(1);
  };

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleCategoryChange = (id: string | "all") => {
    setSelectedCategoryId(id);
    setPage(1);
    scrollToResults();
  };

  const handleSortChange = (s: ProductSort) => {
    setSort(s);
    setPage(1);
    scrollToResults();
  };

  const handlePageChange = (next: number) => {
    setPage(Math.max(1, next));
    scrollToResults();
  };

  return (
    <div className="min-h-screen bg-muted/30 dark:bg-background">
      {/* ============================ Page banner ============================ */}
      <section className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-8 sm:px-6 sm:pb-8 sm:pt-12">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <Badge
                variant="secondary"
                className="mb-3 inline-flex h-6 rounded-full px-2.5 text-[11px] font-normal text-muted-foreground"
              >
                {total.toLocaleString("fa-IR")} محصول موجود
              </Badge>
              <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShoppingBag className="h-5 w-5" aria-hidden="true" />
                </span>
                فروشگاه
              </h1>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                بهترین محصولات فروشندگان سپندتن — با جستجو و فیلترهای سریع
              </p>
            </div>

            {/* Search */}
            <div className="relative w-full sm:w-80 md:w-96">
              <Search className="pointer-events-none absolute inset-s-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی محصول…"
                className="h-12 rounded-2xl bg-muted/40 ps-10 pe-10 text-sm shadow-sm"
                aria-label="جستجوی محصولات"
              />
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setQuery("")}
                  className="absolute inset-e-1.5 top-1/2 h-8 w-8 -translate-y-1/2 rounded-lg text-muted-foreground"
                  aria-label="پاک کردن جستجو"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {debouncedQuery && (
            <p className="mt-3 text-[11px] text-muted-foreground">
              فقط در محصولات این صفحه جستجو می‌شود — برای جستجوی سراسری، بک‌اند
              در حال آماده‌سازی است.
            </p>
          )}
        </div>
      </section>

      {/* ===================== Sticky filter toolbar ======================== */}
      {/* z-30 keeps it above cards but below the navbar (z-40) and portals (z-50) */}
      <div className="sticky top-16 z-30 border-b border-border bg-background/85 shadow-sm backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {/* Row 1: categories + sort + wishlist */}
          <div className="flex items-end gap-2 py-2.5 md:items-center">
            <div className="min-w-0 flex-1">
              <CategoryFilter
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={handleCategoryChange}
                sort={sort}
                onSortChange={handleSortChange}
              />
            </div>

            <Button
              asChild
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl border-border"
            >
              <Link href="/wishlist" aria-label="علاقه‌مندی‌ها">
                <Heart className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* Row 2: active filters */}
          {hasActiveFilter && (
            <div className="flex items-center gap-2 overflow-x-auto border-t border-border/60 py-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 text-[11px] text-muted-foreground">
                فیلتر:
              </span>

              {activeCategory && (
                <FilterPill
                  label={activeCategory.name}
                  onRemove={() => handleCategoryChange("all")}
                  ariaLabel="حذف فیلتر دسته"
                />
              )}

              {debouncedQuery && (
                <FilterPill
                  label={`«${debouncedQuery}»`}
                  onRemove={() => setQuery("")}
                  ariaLabel="حذف جستجو"
                />
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-7 shrink-0 px-2 text-[11px] text-muted-foreground"
                onClick={clearFilters}
              >
                پاک کردن همه
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ============================== Results ============================ */}
      <main
        ref={resultsRef}
        className="mx-auto max-w-6xl scroll-mt-40 px-4 py-6 sm:scroll-mt-48 sm:px-6"
        aria-busy={isLoading || isFetching}
      >
        {isFetching && !isLoading && (
          <div className="mb-3 flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            در حال به‌روزرسانی…
          </div>
        )}

        {isLoading ? (
          <ProductGridSkeleton />
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : visible.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilter} onClear={clearFilters} />
        ) : (
          <>
            <ProductGrid items={visible} />

            {(page > 1 || hasNextPage) && (
              <div className="mt-8 flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="order-2 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground sm:order-1 sm:justify-start sm:text-start">
                  صفحه
                  <Badge
                    variant="secondary"
                    className="h-6 rounded-full px-2 tabular-nums"
                  >
                    {page.toLocaleString("fa-IR")}
                  </Badge>
                  از
                  <span className="tabular-nums">
                    {totalPages.toLocaleString("fa-IR")}
                  </span>
                </p>
                <div className="order-1 flex gap-2 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => handlePageChange(page - 1)}
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
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage || isFetching}
                    onClick={() => handlePageChange(page + 1)}
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
          </>
        )}
      </main>
    </div>
  );
}
