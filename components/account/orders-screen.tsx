"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Calendar,
  Ban,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { cn } from "@/lib/utils";
import {
  useMyCheckouts,
  useDeleteCheckout,
  usePayCheckout,
} from "@/features/orders/hooks";
import type {
  CheckoutSummary,
  MyCheckoutsFilters,
  PaymentStatus,
} from "@/features/orders/types";

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 10;

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  REFUNDED: "استرداد",
  FAILED: "ناموفق",
  CANCELLED: "لغو شده",
};

const PAYMENT_METHOD_LABEL: Record<string, string> = {
  zarinpal: "زرین‌پال",
  idpay: "آیدی‌پی",
  card: "کارت به کارت",
  cod: "پرداخت در محل",
  wallet: "کیف پول",
};

const CHECKOUT_STATUS_LABEL: Record<string, string> = {
  PENDING: "در انتظار",
  CONFIRMED: "تأیید‌شده",
  PROCESSING: "در حال پردازش",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  COMPLETED: "تکمیل‌شده",
  CANCELLED: "لغو‌شده",
  RETURNED: "مرجوعی",
  REFUNDED: "بازگشت وجه",
};

function paymentStatusTone(status: string) {
  const s = status.toUpperCase();
  if (s === "PAID" || s === "COMPLETED")
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
  if (s === "PENDING")
    return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";
  if (s === "FAILED" || s === "CANCELLED")
    return "bg-destructive/10 text-destructive border-destructive/20";
  if (s === "REFUNDED")
    return "bg-sky-500/10 text-sky-700 border-sky-500/20 dark:text-sky-400";
  return "bg-muted text-muted-foreground border-border";
}

function formatMoney(value: string | number) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `${n.toLocaleString("fa-IR")} تومان`;
}

function formatDate(iso: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function humanizePaymentMethod(method?: string | null) {
  if (!method) return "—";
  const key = method.toLowerCase();
  return PAYMENT_METHOD_LABEL[key] ?? method;
}

function humanizeOrderStatus(status: string) {
  if (!status) return "—";
  return CHECKOUT_STATUS_LABEL[status.toUpperCase()] ?? status;
}

/* -------------------------------------------------------------------------- */
/* Filters                                                                    */
/* -------------------------------------------------------------------------- */

type FilterChip = {
  id: string;
  label: string;
  paymentStatus?: PaymentStatus;
  icon: React.ComponentType<{ className?: string }>;
  activeTone: string;
};

const FILTERS: FilterChip[] = [
  {
    id: "all",
    label: "همه",
    icon: Package,
    activeTone: "border-primary bg-primary text-primary-foreground",
  },
  {
    id: "pending",
    label: "در انتظار پرداخت",
    paymentStatus: "PENDING",
    icon: Clock,
    activeTone: "border-amber-500 bg-amber-500 text-white",
  },
  {
    id: "paid",
    label: "پرداخت‌شده",
    paymentStatus: "PAID",
    icon: CheckCircle2,
    activeTone: "border-emerald-500 bg-emerald-500 text-white",
  },
  {
    id: "failed",
    label: "ناموفق",
    paymentStatus: "FAILED",
    icon: XCircle,
    activeTone: "border-destructive bg-destructive text-destructive-foreground",
  },
  {
    id: "refunded",
    label: "استرداد",
    paymentStatus: "REFUNDED",
    icon: RotateCcw,
    activeTone: "border-sky-500 bg-sky-500 text-white",
  },
];

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function CheckoutSkeleton() {
  return (
    <Card className="border-border bg-card">
      <CardContent className="space-y-3 p-3.5 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32 max-w-[70%]" />
            <Skeleton className="h-3 w-40 max-w-[60%]" />
          </div>
          <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
        </div>
        <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5 sm:p-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="flex items-center justify-between pt-1.5">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-2.5 w-16" />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-9 w-full rounded-xl sm:flex-1" />
          <Skeleton className="h-9 w-full rounded-xl sm:w-24" />
        </div>
      </CardContent>
    </Card>
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
      <CardContent className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center sm:px-6 sm:py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/40 sm:h-16 sm:w-16">
          <ShoppingBag
            className="h-6 w-6 text-muted-foreground sm:h-7 sm:w-7"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground sm:text-base">
            {hasFilters ? "سفارشی با این وضعیت یافت نشد" : "هنوز سفارشی ندارید"}
          </h3>
          <p className="mx-auto max-w-sm text-xs text-muted-foreground sm:text-sm">
            {hasFilters
              ? "فیلتر را تغییر دهید یا همه سفارش‌ها را ببینید."
              : "با اولین خرید از فروشگاه، سفارش‌هایتان اینجا نمایش داده می‌شوند."}
          </p>
        </div>
        {hasFilters ? (
          <Button variant="outline" size="sm" onClick={onClear}>
            نمایش همه سفارش‌ها
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href="/store">
              <ShoppingBag className="me-1.5 h-4 w-4" aria-hidden="true" />
              مشاهده فروشگاه
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="flex flex-col items-center justify-center gap-4 px-4 py-12 text-center sm:px-6 sm:py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 sm:h-16 sm:w-16">
          <AlertTriangle
            className="h-6 w-6 text-destructive sm:h-7 sm:w-7"
            aria-hidden="true"
          />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground sm:text-base">
            خطا در دریافت سفارش‌ها
          </h3>
          <p className="mx-auto max-w-md text-xs text-muted-foreground sm:text-sm">
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
/* Checkout card                                                              */
/* -------------------------------------------------------------------------- */

function CheckoutCard({
  item,
  onDeleteRequest,
  onPayRequest,
  isDeleting,
  isPaying,
}: {
  item: CheckoutSummary;
  onDeleteRequest: (item: CheckoutSummary) => void;
  onPayRequest: (item: CheckoutSummary) => void;
  isDeleting: boolean;
  isPaying: boolean;
}) {
  const isPending = item.paymentStatus.toUpperCase() === "PENDING";
  const detailHref = `/store/orders/${item.id}`;
  const hasDiscount = Number(item.discountAmount) > 0;

  return (
    <Card className="group h-full border-border bg-card transition-colors hover:border-primary/30">
      <CardContent className="flex h-full flex-col gap-3 p-3.5 sm:p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <Link href={detailHref} className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary"
              title={item.checkoutNumber || item.id}
            >
              {item.checkoutNumber || item.id}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[11px]">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">{formatDate(item.createdAt)}</span>
            </p>
          </Link>
          <Badge
            variant="outline"
            className={cn(
              "shrink-0 whitespace-nowrap text-[10px] sm:text-[11px]",
              paymentStatusTone(item.paymentStatus),
            )}
          >
            {PAYMENT_STATUS_LABEL[item.paymentStatus] ?? item.paymentStatus}
          </Badge>
        </div>

        {/* Amount block */}
        <div className="space-y-1.5 rounded-lg border border-border/60 bg-muted/20 p-2.5 sm:p-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="shrink-0 text-xs text-muted-foreground">
              مبلغ کل
            </span>
            <span className="min-w-0 truncate text-end text-sm font-bold tabular-nums text-foreground sm:text-base">
              {formatMoney(item.totalAmount)}
            </span>
          </div>
          {hasDiscount && (
            <div className="flex items-baseline justify-between gap-2 text-[10px] sm:text-[11px]">
              <span className="shrink-0 text-muted-foreground">تخفیف</span>
              <span className="min-w-0 truncate text-end font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                − {formatMoney(item.discountAmount)}
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 border-t border-border/60 pt-1.5 text-[10px] text-muted-foreground sm:text-[11px]">
            <span className="inline-flex min-w-0 items-center gap-1">
              <CreditCard className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {humanizePaymentMethod(item.paymentMethod)}
              </span>
            </span>
            <span className="inline-flex min-w-0 items-center gap-1">
              <Ban className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span className="truncate">
                {humanizeOrderStatus(item.status)}
              </span>
            </span>
          </div>
        </div>

        {/* Actions — pinned to bottom */}
        <div className="mt-auto flex flex-col gap-2 pt-0.5 sm:flex-row sm:flex-wrap">
          <Button
            asChild
            size="sm"
            className="h-9 w-full rounded-xl sm:w-auto sm:flex-1"
          >
            <Link href={detailHref}>مشاهده جزئیات</Link>
          </Button>

          {isPending && (
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="h-9 w-full gap-1.5 rounded-xl"
                disabled={isPaying || isDeleting}
                onClick={() => onPayRequest(item)}
                aria-busy={isPaying}
              >
                {isPaying ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                پرداخت
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-9 w-full gap-1.5 rounded-xl text-muted-foreground hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                disabled={isDeleting || isPaying}
                onClick={() => onDeleteRequest(item)}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                حذف
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export function OrdersScreen() {
  const [page, setPage] = useState(1);
  const [filterId, setFilterId] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<CheckoutSummary | null>(
    null,
  );

  const filters: MyCheckoutsFilters = useMemo(() => {
    const chip = FILTERS.find((f) => f.id === filterId);
    return {
      page,
      limit: PAGE_SIZE,
      order: "desc",
      paymentStatus: chip?.paymentStatus,
    };
  }, [page, filterId]);

  const { data, isLoading, isError, isFetching, refetch } =
    useMyCheckouts(filters);
  const deleteCheckout = useDeleteCheckout();
  const payCheckout = usePayCheckout();

  const checkouts = data?.checkouts ?? [];
  const pagination = data?.pagination;
  const total = pagination?.total ?? checkouts.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE) || 1);
  const hasNext =
    pagination?.nextPage != null
      ? Number(pagination.nextPage) > page
      : page < totalPages;
  const hasFilters = filterId !== "all";

  const handleDelete = () => {
    if (!pendingDelete) return;
    deleteCheckout.mutate(pendingDelete.id, {
      onSettled: () => setPendingDelete(null),
    });
  };

  return (
    <div className="min-h-screen w-full bg-muted/30 dark:bg-background">
      <div className="mx-auto w-full max-w-6xl space-y-4 px-3 py-5 sm:space-y-5 sm:px-6 sm:py-6 lg:space-y-6 lg:px-8 lg:py-8">
        {/* ------------------------------ Header --------------------------- */}
        <header className="flex items-start justify-between gap-2 sm:items-center sm:gap-3">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full sm:h-9 sm:w-9"
            >
              <Link href="/account" aria-label="بازگشت به حساب کاربری">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 text-base font-bold sm:gap-2 sm:text-lg lg:text-xl">
                <span className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:flex">
                  <Package className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="truncate">سفارش‌های من</span>
              </h1>
              <p
                className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground sm:text-xs"
                aria-live="polite"
              >
                <span className="truncate">
                  {total > 0
                    ? `${total.toLocaleString("fa-IR")} سفارش`
                    : "تاریخچه سفارش‌ها"}
                </span>
                {isFetching && (
                  <Loader2
                    className="h-3 w-3 shrink-0 animate-spin"
                    aria-hidden="true"
                  />
                )}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0 rounded-full sm:h-9 sm:w-9"
            onClick={() => void refetch()}
            disabled={isFetching}
            aria-label="به‌روزرسانی"
          >
            <RefreshCw
              className={cn(
                "h-3.5 w-3.5 sm:h-4 sm:w-4",
                isFetching && "animate-spin",
              )}
            />
          </Button>
        </header>

        {/* ------------------------------ Filters -------------------------- */}
        <div
          className="-mx-3 flex flex-wrap gap-1.5 overflow-x-auto px-3 pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:px-0 lg:flex-nowrap"
          role="tablist"
          aria-label="فیلتر وضعیت پرداخت"
        >
          {FILTERS.map((f) => {
            const Icon = f.icon;
            const active = filterId === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFilterId(f.id);
                  setPage(1);
                }}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  active
                    ? f.activeTone
                    : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                <Icon
                  className="h-3 w-3 sm:h-3.5 sm:w-3.5"
                  aria-hidden="true"
                />
                {f.label}
              </button>
            );
          })}
        </div>

        {/* ------------------------------ Body ----------------------------- */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CheckoutSkeleton key={i} />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => void refetch()} />
        ) : checkouts.length === 0 ? (
          <EmptyState
            hasFilters={hasFilters}
            onClear={() => {
              setFilterId("all");
              setPage(1);
            }}
          />
        ) : (
          <>
            {/* Cards grid: 1 col mobile, 2 cols on lg */}
            <div className="grid grid-cols-1 gap-2.5 sm:gap-3 lg:grid-cols-2 lg:gap-4">
              {checkouts.map((item) => (
                <CheckoutCard
                  key={item.id}
                  item={item}
                  isDeleting={
                    deleteCheckout.isPending &&
                    deleteCheckout.variables === item.id
                  }
                  isPaying={
                    payCheckout.isPending && payCheckout.variables === item.id
                  }
                  onDeleteRequest={(c) => setPendingDelete(c)}
                  onPayRequest={(c) => payCheckout.mutate(c.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {(page > 1 || hasNext) && (
              <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <p className="order-2 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 text-center text-[11px] text-muted-foreground sm:order-1 sm:justify-start sm:text-start sm:text-xs">
                  <span className="whitespace-nowrap">
                    صفحه {page.toLocaleString("fa-IR")}
                  </span>
                  <span className="whitespace-nowrap">
                    از {totalPages.toLocaleString("fa-IR")}
                  </span>
                  {total > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="whitespace-nowrap">
                        {total.toLocaleString("fa-IR")} سفارش
                      </span>
                    </>
                  )}
                </p>
                <div className="order-1 grid grid-cols-2 gap-2 sm:order-2 sm:flex">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1 || isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-9 w-full sm:w-auto"
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
                    disabled={!hasNext || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    className="h-9 w-full sm:w-auto"
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
      </div>

      {/* ---------------------- Delete confirmation ---------------------- */}
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
                  حذف سفارش
                </AlertDialogTitle>
                <AlertDialogDescription className="mt-1 wrap-break-word text-start">
                  سفارش «{pendingDelete?.checkoutNumber || pendingDelete?.id}»
                  برای همیشه حذف می‌شود. این عملیات قابل بازگشت نیست.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialogCancel
              className="w-full sm:w-auto"
              disabled={deleteCheckout.isPending}
            >
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:w-auto"
              onClick={handleDelete}
              disabled={deleteCheckout.isPending}
            >
              {deleteCheckout.isPending ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="me-2 h-4 w-4" aria-hidden="true" />
              )}
              حذف سفارش
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
