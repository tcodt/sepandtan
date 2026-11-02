"use client";

import { useMemo, useState } from "react";
import { Search, ShoppingBag, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/features/products/hooks";
import { useCategorySelector } from "@/features/catalog/categories/hooks";
import type { ProductListFilters } from "@/features/products/types";
import ProductGrid from "./product-grid";
import CategoryFilter from "./category";

export default function StoreClient() {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "all">(
    "all",
  );
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<ProductListFilters["sort"]>("newest");

  const filters: ProductListFilters = useMemo(
    () => ({
      category: selectedCategoryId === "all" ? undefined : selectedCategoryId,
      sort,
      page,
      limit: 12,
    }),
    [selectedCategoryId, sort, page],
  );

  const { data, isLoading, isFetching, isError, refetch } =
    useProducts(filters);
  const { data: categories = [] } = useCategorySelector(false);

  const products = useMemo(() => data?.products ?? [], [data?.products]);
  const total = data?.pagination.total ?? products.length;

  // جستجوی سمت‌کلاینت روی صفحه فعلی (تا وقتی بک‌اند search روی /products بدهد)
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.name.toLowerCase().includes(q) ||
        (p.brand?.name?.toLowerCase().includes(q) ?? false),
    );
  }, [products, query]);

  return (
    <div className="min-h-screen bg-muted">
      <div className="sticky top-16 z-20 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="flex flex-row flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                فروشگاه
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {total.toLocaleString("fa-IR")} محصول
                {isFetching ? " · در حال به‌روزرسانی…" : ""}
              </p>
            </div>

            <div className="relative flex-1 min-w-50 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجوی محصول..."
                className="h-11 pr-10 rounded-xl bg-background"
              />
            </div>
          </div>

          <CategoryFilter
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onCategoryChange={(id) => {
              setSelectedCategoryId(id);
              setPage(1);
            }}
            sort={sort}
            onSortChange={(s) => {
              setSort(s);
              setPage(1);
            }}
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-muted-foreground">خطا در دریافت محصولات</p>
            <Button variant="outline" onClick={() => refetch()}>
              تلاش مجدد
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            محصولی یافت نشد
          </p>
        ) : (
          <>
            <ProductGrid items={visible} />
            <div className="flex items-center justify-center gap-3 mt-8">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                قبلی
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                صفحه {page.toLocaleString("fa-IR")}
              </span>
              <Button
                variant="outline"
                disabled={!data?.pagination.nextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                بعدی
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
