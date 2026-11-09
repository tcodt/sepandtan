"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Loader2,
  Package,
  Pencil,
  Trash2,
  Plus,
  Search,
  X,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminProducts, useDeleteProduct } from "@/features/products/hooks";
import type {
  AdminProductFilters,
  BackendProductStatus,
} from "@/features/products/types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const STATUS_FILTERS: Array<{
  id: string;
  label: string;
  status?: BackendProductStatus | "all";
  tone: string;
  activeTone: string;
}> = [
  {
    id: "all",
    label: "همه",
    status: "all",
    tone: "border-border bg-background text-muted-foreground hover:border-primary/40",
    activeTone: "border-primary bg-primary text-primary-foreground",
  },
  {
    id: "pending",
    label: "در انتظار",
    status: "PENDING",
    tone: "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-400 hover:border-amber-500/40",
    activeTone: "border-amber-500 bg-amber-500 text-white",
  },
  {
    id: "active",
    label: "تأییدشده",
    status: "ACTIVE",
    tone: "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 hover:border-emerald-500/40",
    activeTone: "border-emerald-500 bg-emerald-500 text-white",
  },
  {
    id: "rejected",
    label: "ردشده",
    status: "REJECTED",
    tone: "border-destructive/20 bg-destructive/5 text-destructive hover:border-destructive/40",
    activeTone: "border-destructive bg-destructive text-destructive-foreground",
  },
  {
    id: "draft",
    label: "پیش‌نویس",
    status: "DRAFT",
    tone: "border-border bg-background text-muted-foreground hover:border-primary/40",
    activeTone: "border-zinc-500 bg-zinc-500 text-white",
  },
  {
    id: "inactive",
    label: "غیرفعال",
    status: "INACTIVE",
    tone: "border-border bg-background text-muted-foreground hover:border-primary/40",
    activeTone: "border-zinc-600 bg-zinc-600 text-white",
  },
];

const STATUS_LABEL: Record<string, string> = {
  APPROVED: "تأییدشده",
  ACTIVE: "فعال",
  PENDING: "در انتظار",
  DRAFT: "پیش‌نویس",
  REJECTED: "ردشده",
  INACTIVE: "غیرفعال",
  OUT_OF_STOCK: "ناموجود",
  BANNED: "مسدود",
  DELETED: "حذف‌شده",
};

function fa(n: number) {
  return n.toLocaleString("fa-IR");
}

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED" || s === "ACTIVE")
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  if (s === "PENDING" || s === "DRAFT")
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  if (s === "REJECTED" || s === "BANNED" || s === "DELETED")
    return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground border-border";
}

function statusLabel(status: string) {
  return STATUS_LABEL[status.toUpperCase()] ?? status;
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function ProductSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-background p-3 sm:p-4">
      <Skeleton className="h-16 w-16 shrink-0 rounded-xl sm:h-20 sm:w-20" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export function SellerProductsScreen() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  // Debounced live search — 300ms after typing stops
  useEffect(() => {
    const id = setTimeout(() => {
      if (searchInput !== search) {
        setPage(1);
        setSearch(searchInput);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [searchInput, search]);

  const filters: AdminProductFilters = useMemo(() => {
    const chip = STATUS_FILTERS.find((f) => f.id === statusId);
    return {
      page,
      limit: 12,
      search: search.trim() || undefined,
      status: chip?.status,
    };
  }, [page, search, statusId]);

  const { data, isLoading, isError, isFetching, refetch } =
    useAdminProducts(filters);
  const deleteProduct = useDeleteProduct();

  const products = useMemo(() => data?.products ?? [], [data?.products]);
  const total = data?.pagination?.total ?? 0;
  const hasNext = data?.pagination?.nextPage != null;
  const hasFilters = !!search || statusId !== "all";

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setStatusId("all");
    setPage(1);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    deleteProduct.mutate(pendingDelete.id, {
      onSettled: () => setPendingDelete(null),
    });
  };

  return (
    <div className="space-y-5">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-4 w-4" aria-hidden="true" />
            </span>
            محصولات
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {total > 0 ? `${fa(total)} مورد` : "لیست محصولات فروشگاه شما"}
            {isFetching && (
              <span className="ms-1 inline-flex items-center gap-1">
                <Loader2 className="inline h-3 w-3 animate-spin" />
                در حال به‌روزرسانی…
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="به‌روزرسانی"
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
          <Button asChild size="sm" className="h-9">
            <Link href="/seller/products/new">
              <Plus className="me-1.5 h-3.5 w-3.5" />
              محصول جدید
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/seller">بازگشت</Link>
          </Button>
        </div>
      </header>

      {/* ------------------------------ Search ------------------------------ */}
      <div className="relative">
        <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="جستجوی عنوان محصول…"
          className="h-10 ps-9 pe-9"
          aria-label="جستجوی محصولات"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearch("");
              setPage(1);
            }}
            className="absolute inset-e-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label="پاک کردن جستجو"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ------------------------------ Filters ----------------------------- */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              setStatusId(f.id);
              setPage(1);
            }}
            aria-pressed={statusId === f.id}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              statusId === f.id ? f.activeTone : f.tone,
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ------------------------------ List -------------------------------- */}
      <section aria-busy={isLoading || isFetching} className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-destructive/20 bg-destructive/5 px-6 py-12 text-center">
            <AlertTriangle
              className="h-7 w-7 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                خطا در دریافت محصولات
              </p>
              <p className="text-xs text-muted-foreground">
                اتصال را بررسی کنید یا دوباره تلاش کنید.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="me-2 h-4 w-4" />
              تلاش مجدد
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-border bg-card px-6 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
              <Package
                className="h-7 w-7 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                {hasFilters
                  ? "محصولی با این فیلترها یافت نشد"
                  : "هنوز محصولی ثبت نکرده‌اید"}
              </h3>
              <p className="mx-auto max-w-sm text-sm text-muted-foreground">
                {hasFilters
                  ? "فیلترها را تغییر دهید یا جستجو را پاک کنید."
                  : "اولین محصول خود را ایجاد کنید تا در فروشگاه نمایش داده شود."}
              </p>
            </div>
            {hasFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                پاک کردن فیلترها
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/seller/products/new">
                  <Plus className="me-1.5 h-4 w-4" />
                  ایجاد اولین محصول
                </Link>
              </Button>
            )}
          </div>
        ) : (
          products.map((p) => {
            const img = p.images[0]?.url;
            return (
              <article
                key={p.id}
                className="flex gap-3 rounded-2xl border border-border bg-background p-3 transition-colors hover:bg-muted/30 sm:p-4"
              >
                <Link
                  href={`/store/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted sm:size-20"
                  aria-label={`مشاهده ${p.title} در فروشگاه`}
                >
                  {img ? (
                    <Image
                      src={img}
                      alt={p.title}
                      fill
                      className="object-contain p-1"
                      sizes="80px"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Package
                        className="h-6 w-6 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </div>
                  )}
                </Link>

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/store/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="line-clamp-2 text-sm font-semibold hover:text-primary"
                    >
                      {p.title}
                      <ExternalLink
                        className="ms-1 inline h-3 w-3 opacity-50"
                        aria-hidden="true"
                      />
                    </Link>
                    <Badge
                      variant="outline"
                      className={cn(
                        "shrink-0 text-[10px]",
                        statusClass(p.status),
                      )}
                    >
                      {statusLabel(p.status)}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {p.category.name}
                    {p.minPrice != null ? ` · از ${fa(p.minPrice)} تومان` : ""}
                  </p>

                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    فروش: {fa(p.saleCount)} · بازدید: {fa(p.viewCount)}
                  </p>

                  <div className="flex gap-2 pt-1">
                    <Button asChild size="sm" variant="outline" className="h-8">
                      <Link href={`/seller/products/${p.id}/edit`}>
                        <Pencil className="me-1 h-3.5 w-3.5" />
                        ویرایش
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-muted-foreground hover:text-destructive"
                      disabled={deleteProduct.isPending}
                      onClick={() =>
                        setPendingDelete({ id: p.id, title: p.title })
                      }
                    >
                      <Trash2 className="me-1 h-3.5 w-3.5" />
                      حذف
                    </Button>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </section>

      {/* ------------------------------ Pagination ------------------------- */}
      {(page > 1 || hasNext) && !isLoading && !isError && (
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-start">
            صفحه {fa(page)}
            {total > 0 ? ` از ${fa(Math.max(1, Math.ceil(total / 12)))}` : ""}
          </p>
          <div className="order-1 flex gap-2 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="h-9 flex-1 sm:flex-none"
            >
              قبلی
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasNext || isFetching}
              onClick={() => setPage((p) => p + 1)}
              className="h-9 flex-1 sm:flex-none"
            >
              بعدی
            </Button>
          </div>
        </div>
      )}

      {/* -------------------------- Delete dialog -------------------------- */}
      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-destructive/20 bg-destructive/10 text-destructive">
                <Trash2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <AlertDialogTitle className="text-start">
                  حذف محصول
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1 text-start">
                  «{pendingDelete?.title}» حذف شود؟ این عملیات قابل بازگشت نیست.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              className="w-full sm:w-auto"
              disabled={deleteProduct.isPending}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              onClick={confirmDelete}
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="me-2 h-4 w-4" aria-hidden="true" />
              )}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
