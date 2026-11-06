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
} from "lucide-react";

import {
  useAdminProducts,
  useApproveProduct,
  useToggleProductFeature,
} from "@/features/products/hooks";
import type {
  AdminProductDetail,
  AdminProductFilters,
  ProductStatus,
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
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const STATUS_FILTERS: Array<{
  id: string;
  label: string;
  status?: ProductStatus;
}> = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار", status: "PENDING" },
  { id: "approved", label: "تأییدشده", status: "APPROVED" },
  { id: "rejected", label: "ردشده", status: "REJECTED" },
];

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

function ProductThumb({ product }: { product: AdminProductDetail }) {
  const img = product.images[0]?.url;
  return (
    <div className="relative size-12 sm:size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
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
          <Package className="size-5 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

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
          className="h-9 w-9 shrink-0"
          disabled={busy}
          aria-label={`اقدامات ${product.title}`}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          moderation
        </DropdownMenuLabel>
        <DropdownMenuItem
          disabled={!canApprove || busy}
          onClick={() => onApprove(product)}
        >
          <CheckCircle2 className="me-2 h-4 w-4 text-emerald-600" />
          تأیید محصول
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
          <Link href={`/store/${product.slug}`} target="_blank">
            <ExternalLink className="me-2 h-4 w-4" />
            مشاهده در فروشگاه
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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

  const products = data?.products ?? [];
  const total = data?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const busy = approveMutation.isPending || featureMutation.isPending;
  const hasFilters = !!search || statusId !== "all" || featuredOnly !== "all";

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
      <header className="flex flex-col gap-1">
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight sm:text-2xl">
          <Package className="size-5 text-primary" />
          moderation محصولات
        </h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          تأیید، رد نمایش عمومی و ویژه کردن محصولات فروشگاه
        </p>
      </header>

      {/* Filters */}
      <section className="space-y-3" aria-label="فیلتر محصولات">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="جستجوی عنوان محصول…"
              className="h-10 pr-10"
            />
          </div>
          <Button className="h-10 shrink-0" onClick={handleSearch}>
            جستجو
          </Button>
          <Button
            variant="outline"
            className="h-10 shrink-0 lg:hidden"
            onClick={() => setMobileFiltersOpen(true)}
          >
            <SlidersHorizontal className="me-2 size-4" />
            فیلتر
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden h-10 w-10 shrink-0 lg:inline-flex"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="به‌روزرسانی"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        </div>

        {/* Desktop filters */}
        <div className="hidden flex-wrap items-end gap-3 lg:flex">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">وضعیت</label>
            <div className="flex gap-2">
              {STATUS_FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => {
                    setStatusId(f.id);
                    setPage(1);
                  }}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    statusId === f.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-40 space-y-1.5">
            <label className="text-xs text-muted-foreground">ویژه</label>
            <Select
              value={featuredOnly}
              onValueChange={(v) => {
                setFeaturedOnly(v as "all" | "yes" | "no");
                setPage(1);
              }}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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
              <X className="me-1.5 size-3.5" />
              پاک کردن
            </Button>
          )}
        </div>

        {/* Mobile filter sheet */}
        <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <SheetContent side="bottom" className="lg:hidden">
            <SheetHeader>
              <SheetTitle>فیلتر محصولات</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">وضعیت</label>
                <div className="flex flex-wrap gap-2">
                  {STATUS_FILTERS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setStatusId(f.id);
                        setPage(1);
                      }}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium",
                        statusId === f.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground",
                      )}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">ویژه</label>
                <Select
                  value={featuredOnly}
                  onValueChange={(v) => {
                    setFeaturedOnly(v as "all" | "yes" | "no");
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">همه</SelectItem>
                    <SelectItem value="yes">فقط ویژه</SelectItem>
                    <SelectItem value="no">غیر ویژه</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full"
                onClick={() => setMobileFiltersOpen(false)}
              >
                اعمال
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </section>

      {/* List */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-16">
            <AlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "خطا در دریافت محصولات"}
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="me-2 size-4" />
              تلاش دوباره
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <Package className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">محصولی یافت نشد</p>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={resetFilters}>
                پاک کردن فیلترها
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="flex gap-3 rounded-xl border border-border bg-background p-3"
                >
                  <ProductThumb product={p} />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-semibold">
                        {p.title}
                      </h3>
                      <ProductActions
                        product={p}
                        busy={busy}
                        onApprove={setPendingApprove}
                        onToggleFeature={(prod) =>
                          featureMutation.mutate(prod.id)
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
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
                        <Badge className="text-[10px]">ویژه</Badge>
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
                  <TableRow>
                    <TableHead>محصول</TableHead>
                    <TableHead>فروشگاه</TableHead>
                    <TableHead>وضعیت</TableHead>
                    <TableHead>آمار</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <ProductThumb product={p} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {p.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {p.category.name}
                              {p.isFeatured ? " · ویژه" : ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {p.store?.name || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-xs", statusClass(p.status))}
                        >
                          {statusLabel(p.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        فروش {fa(p.saleCount)} · بازدید {fa(p.viewCount)}
                        {p.minPrice != null ? ` · از ${fa(p.minPrice)}` : ""}
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

            <div className="flex items-center justify-between border-t border-border px-4 py-3">
              <p className="text-xs text-muted-foreground">
                {fa(total)} محصول
                {isFetching ? " · در حال به‌روزرسانی…" : ""}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1 || isFetching}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronRight className="me-1 size-4" />
                  قبلی
                </Button>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {fa(page)} / {fa(totalPages)}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages || isFetching}
                  onClick={() => setPage((p) => p + 1)}
                >
                  بعدی
                  <ChevronLeft className="ms-1 size-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </section>

      <AlertDialog
        open={!!pendingApprove}
        onOpenChange={(open) => !open && setPendingApprove(null)}
      >
        <AlertDialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>تأیید محصول</AlertDialogTitle>
            <AlertDialogDescription>
              «{pendingApprove?.title}» تأیید و در فروشگاه عمومی نمایش داده شود؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel className="w-full sm:w-auto">
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full sm:w-auto"
              onClick={confirmApprove}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="me-2 size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="me-2 size-4" />
              )}
              تأیید
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
