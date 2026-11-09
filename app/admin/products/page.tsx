"use client";

import { useCallback, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Package,
  Search,
  Loader2,
  MoreHorizontal,
  CheckCircle2,
  Star,
  StarOff,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  X,
  SlidersHorizontal,
  ShoppingBag,
} from "lucide-react";

import {
  useAdminProducts,
  useApproveProduct,
  useToggleProductFeature,
} from "@/features/products/hooks";
import type {
  AdminProductDetail,
  AdminProductFilters,
  BackendProductStatus,
} from "@/features/products/types";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 20;

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

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function statusClass(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED" || s === "ACTIVE")
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  if (s === "PENDING" || s === "DRAFT")
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  if (s === "REJECTED" || s === "BANNED" || s === "DELETED")
    return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground";
}

function statusLabel(status: string) {
  const s = status.toUpperCase();
  if (s === "APPROVED" || s === "ACTIVE") return "تأییدشده";
  if (s === "PENDING") return "در انتظار";
  if (s === "DRAFT") return "پیش‌نویس";
  if (s === "REJECTED") return "ردشده";
  if (s === "INACTIVE") return "غیرفعال";
  if (s === "OUT_OF_STOCK") return "ناموجود";
  if (s === "BANNED") return "مسدود";
  if (s === "DELETED") return "حذف‌شده";
  return status;
}

function fa(n: number) {
  return n.toLocaleString("fa-IR");
}

/* -------------------------------------------------------------------------- */
/* Product thumb                                                              */
/* -------------------------------------------------------------------------- */

function ProductThumb({
  product,
  size = "md",
}: {
  product: AdminProductDetail;
  size?: "sm" | "md";
}) {
  const img = product.images[0]?.url;
  const dim = size === "sm" ? "size-10" : "size-12 sm:size-14";
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-xl bg-muted",
        dim,
      )}
    >
      {img ? (
        <Image
          src={img}
          alt={product.title}
          fill
          className="object-contain p-1"
          sizes="56px"
        />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Package
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Product actions                                                            */
/* -------------------------------------------------------------------------- */

function ProductActions({
  product,
  busy,
  onApprove,
  onToggleFeature,
}: {
  product: AdminProductDetail;
  busy: boolean;
  onApprove: (p: AdminProductDetail) => void;
  onToggleFeature: (p: AdminProductDetail) => void;
}) {
  const status = product.status.toUpperCase();
  const canApprove =
    status === "PENDING" || status === "DRAFT" || status === "REJECTED";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0 data-[state=open]:bg-muted"
          disabled={busy}
          aria-label={`اقدامات ${product.title}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          مدیریت محصول
        </DropdownMenuLabel>

        <DropdownMenuItem
          disabled={!canApprove || busy}
          onClick={() => onApprove(product)}
        >
          <CheckCircle2 className="me-2 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          تأیید نمایش عمومی
        </DropdownMenuItem>

        <DropdownMenuItem
          disabled={busy}
          onClick={() => onToggleFeature(product)}
        >
          {product.isFeatured ? (
            <>
              <StarOff className="me-2 h-4 w-4" />
              حذف از ویژه
            </>
          ) : (
            <>
              <Star className="me-2 h-4 w-4 text-amber-500" />
              ویژه کردن
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/store/${product.slug}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="me-2 h-4 w-4" />
            مشاهده در فروشگاه
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty / error                                                              */
/* -------------------------------------------------------------------------- */

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5">
        <AlertTriangle
          className="h-7 w-7 text-destructive"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          خطا در دریافت محصولات
        </h3>
        <p className="mx-auto max-w-md wrap-break-word text-sm text-muted-foreground">
          {message}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />
        تلاش دوباره
      </Button>
    </div>
  );
}

function EmptyState({
  hasFilters,
  onReset,
}: {
  hasFilters: boolean;
  onReset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center sm:py-20">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-muted/40">
        <ShoppingBag
          className="h-7 w-7 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-foreground">
          {hasFilters
            ? "محصولی با این فیلترها یافت نشد"
            : "هنوز محصولی ثبت نشده"}
        </h3>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {hasFilters
            ? "فیلترها را تغییر دهید یا جستجو را پاک کنید."
            : "به‌محض ثبت اولین محصولات توسط فروشندگان، اینجا نمایش داده می‌شوند."}
        </p>
      </div>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onReset}>
          پاک کردن فیلترها
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState("pending");
  const [featuredOnly, setFeaturedOnly] = useState<"all" | "yes" | "no">("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [pendingApprove, setPendingApprove] =
    useState<AdminProductDetail | null>(null);

  const filters: AdminProductFilters = useMemo(() => {
    const chip = STATUS_FILTERS.find((f) => f.id === statusId);
    return {
      page,
      limit: PAGE_SIZE,
      search: search.trim() || undefined,
      status: chip?.status,
      featured:
        featuredOnly === "yes"
          ? true
          : featuredOnly === "no"
            ? false
            : undefined,
      sort: "updatedAt",
    };
  }, [page, search, statusId, featuredOnly]);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useAdminProducts(filters);
  const approveMutation = useApproveProduct();
  const featureMutation = useToggleProductFeature();

  const products = useMemo(() => data?.products ?? [], [data?.products]);
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const busy = approveMutation.isPending || featureMutation.isPending;
  const hasFilters = !!search || statusId !== "all" || featuredOnly !== "all";
  const activeFilterCount =
    (statusId !== "all" ? 1 : 0) + (featuredOnly !== "all" ? 1 : 0);

  const handleSearch = useCallback(() => {
    setPage(1);
    setSearch(searchInput.trim());
  }, [searchInput]);

  const resetFilters = useCallback(() => {
    setSearch("");
    setSearchInput("");
    setStatusId("all");
    setFeaturedOnly("all");
    setPage(1);
  }, []);

  const confirmApprove = () => {
    if (!pendingApprove) return;
    approveMutation.mutate(pendingApprove.id, {
      onSettled: () => setPendingApprove(null),
    });
  };

  return (
    <div className="mx-auto w-full max-w-7xl space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6 lg:px-8">
      {/* ------------------------------ Header ------------------------------ */}
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Package className="h-4 w-4" aria-hidden="true" />
          </span>
          مدیریت محصولات
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          تأیید، ویژه‌سازی و مشاهده محصولات فروشگاه
        </p>
      </header>

      {/* ------------------------------ Filters ----------------------------- */}
      <section className="space-y-3" aria-label="فیلتر محصولات">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-s-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="جستجوی عنوان محصول…"
              className="h-10 ps-9 pe-9"
              aria-label="جستجوی محصولات"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                className="absolute inset-e-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                aria-label="پاک کردن جستجو"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <Button className="h-10 shrink-0" onClick={handleSearch}>
            جستجو
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 shrink-0"
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
          <Button
            variant="outline"
            className="relative h-10 shrink-0 lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
            aria-label="فیلترها"
          >
            <SlidersHorizontal className="me-2 h-4 w-4" aria-hidden="true" />
            فیلتر
            {activeFilterCount > 0 && (
              <span className="ms-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                {fa(activeFilterCount)}
              </span>
            )}
          </Button>
        </div>

        {/* Desktop filters */}
        <div className="hidden flex-wrap items-end gap-3 lg:flex">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              وضعیت
            </label>
            <div className="flex flex-wrap gap-2">
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
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    statusId === f.id ? f.activeTone : f.tone,
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-40 space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              ویژه
            </label>
            <Select
              value={featuredOnly}
              onValueChange={(v) => {
                setFeaturedOnly(v as "all" | "yes" | "no");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10" dir="rtl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">همه</SelectItem>
                <SelectItem value="yes">فقط ویژه</SelectItem>
                <SelectItem value="no">غیر ویژه</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-10 text-muted-foreground"
              onClick={resetFilters}
            >
              <X className="me-1.5 h-3.5 w-3.5" aria-hidden="true" />
              پاک کردن
            </Button>
          )}
        </div>

        {/* Mobile filters — bottom sheet */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetContent
            side="bottom"
            dir="rtl"
            className="max-h-[85vh] rounded-t-2xl p-0 lg:hidden"
          >
            <div
              className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-muted-foreground/30"
              aria-hidden="true"
            />
            <SheetHeader className="px-4 pb-2 pt-3">
              <SheetTitle>فیلتر محصولات</SheetTitle>
              <SheetDescription>
                برای محدود کردن نتایج، فیلترها را اعمال کنید.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4 pb-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  وضعیت
                </label>
                <div className="flex flex-wrap gap-2">
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
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        statusId === f.id ? f.activeTone : f.tone,
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  ویژه
                </label>
                <Select
                  value={featuredOnly}
                  onValueChange={(v) => {
                    setFeaturedOnly(v as "all" | "yes" | "no");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-10" dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent dir="rtl">
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="yes">فقط ویژه</SelectItem>
                    <SelectItem value="no">غیر ویژه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetFilters}
                >
                  بازنشانی
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  اعمال
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </section>

      {/* ------------------------------ List ------------------------------- */}
      <section
        className="overflow-hidden rounded-2xl border border-border bg-card"
        aria-busy={isLoading || isFetching}
      >
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : "خطای ناشناخته"}
            onRetry={() => refetch()}
          />
        ) : products.length === 0 ? (
          <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="flex gap-3 rounded-xl border border-border bg-background p-3 transition-colors hover:bg-muted/30"
                >
                  <Link
                    href={`/store/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <ProductThumb product={p} />
                  </Link>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/store/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-2 text-sm font-semibold hover:text-primary"
                      >
                        {p.title}
                      </Link>
                      <ProductActions
                        product={p}
                        busy={busy}
                        onApprove={setPendingApprove}
                        onToggleFeature={(prod) =>
                          featureMutation.mutate(prod.id)
                        }
                      />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {p.store?.name || "—"} · {p.category.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("text-[10px]", statusClass(p.status))}
                      >
                        {statusLabel(p.status)}
                      </Badge>
                      {p.isFeatured && (
                        <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400">
                          <Star className="me-1 h-3 w-3" aria-hidden="true" />
                          ویژه
                        </Badge>
                      )}
                      {p.minPrice != null && (
                        <span className="text-[11px] tabular-nums text-muted-foreground">
                          از {fa(p.minPrice)} تومان
                        </span>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-start">محصول</TableHead>
                    <TableHead className="text-start">فروشگاه</TableHead>
                    <TableHead className="text-start">وضعیت</TableHead>
                    <TableHead className="text-start">قیمت</TableHead>
                    <TableHead className="text-start">آمار</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow
                      key={p.id}
                      className="transition-colors duration-150 hover:bg-muted/40"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductThumb product={p} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {p.title}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {p.category.name}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-40 truncate text-sm text-muted-foreground">
                        {p.store?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", statusClass(p.status))}
                          >
                            {statusLabel(p.status)}
                          </Badge>
                          {p.isFeatured && (
                            <Badge className="border-amber-500/20 bg-amber-500/10 text-[10px] text-amber-700 dark:text-amber-400">
                              <Star
                                className="me-1 h-3 w-3"
                                aria-hidden="true"
                              />
                              ویژه
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-sm">
                        {p.minPrice != null ? (
                          <span>
                            از {fa(p.minPrice)}{" "}
                            <span className="text-xs text-muted-foreground">
                              تومان
                            </span>
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        <div>فروش {fa(p.saleCount)}</div>
                        <div>بازدید {fa(p.viewCount)}</div>
                      </TableCell>
                      <TableCell>
                        <ProductActions
                          product={p}
                          busy={busy}
                          onApprove={setPendingApprove}
                          onToggleFeature={(prod) =>
                            featureMutation.mutate(prod.id)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="order-2 text-center text-xs text-muted-foreground sm:order-1 sm:text-start">
                {fa(total)} محصول
                {isFetching && (
                  <span className="ms-1 inline-flex items-center gap-1">
                    <Loader2 className="inline h-3 w-3 animate-spin" />
                    در حال به‌روزرسانی…
                  </span>
                )}
              </p>
              <div className="order-1 flex items-center justify-center gap-2 sm:order-2">
                <Button
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
                <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                  {fa(page)} / {fa(totalPages)}
                </span>
                <Button
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
          </>
        )}
      </section>

      {/* ---------------------- Approve confirmation ----------------------- */}
      <AlertDialog
        open={!!pendingApprove}
        onOpenChange={(open) => !open && setPendingApprove(null)}
      >
        <AlertDialogContent
          dir="rtl"
          className="max-w-[calc(100vw-2rem)] sm:max-w-md"
        >
          <AlertDialogHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <AlertDialogTitle className="text-start">
                  تأیید محصول
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1 text-start">
                  «{pendingApprove?.title}» تأیید و در فروشگاه عمومی نمایش داده
                  شود؟
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              className="w-full sm:w-auto"
              disabled={approveMutation.isPending}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-emerald-600 text-white hover:bg-emerald-600/90 sm:w-auto"
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="me-2 h-4 w-4" aria-hidden="true" />
              )}
              تأیید
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
