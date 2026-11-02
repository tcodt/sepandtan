"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Loader2,
  Package,
  RefreshCw,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMyCheckouts, useDeleteCheckout } from "@/features/orders/hooks";
import type {
  CheckoutSummary,
  MyCheckoutsFilters,
  PaymentStatus,
} from "@/features/orders/types";

const paymentLabels: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  REFUNDED: "استرداد",
  FAILED: "ناموفق",
};

const statusTone = (status: string) => {
  const s = status.toUpperCase();
  if (s === "PAID" || s === "COMPLETED" || s === "DELIVERED")
    return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20";
  if (s === "PENDING")
    return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20";
  if (s === "FAILED" || s === "CANCELLED")
    return "bg-destructive/10 text-destructive border-destructive/20";
  return "bg-muted text-muted-foreground border-border";
};

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

type FilterChip = {
  id: string;
  label: string;
  paymentStatus?: PaymentStatus;
};

const FILTERS: FilterChip[] = [
  { id: "all", label: "همه" },
  { id: "pending", label: "در انتظار پرداخت", paymentStatus: "PENDING" },
  { id: "paid", label: "پرداخت‌شده", paymentStatus: "PAID" },
  { id: "failed", label: "ناموفق", paymentStatus: "FAILED" },
];

function CheckoutCard({
  item,
  onDelete,
  deleting,
}: {
  item: CheckoutSummary;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card/80 p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-semibold truncate">
            {item.checkoutNumber || item.id}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(item.createdAt)}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[11px]", statusTone(item.paymentStatus))}
        >
          {paymentLabels[item.paymentStatus] ?? item.paymentStatus}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">مبلغ کل</span>
        <span className="font-bold tabular-nums">
          {formatMoney(item.totalAmount)}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>روش پرداخت: {item.paymentMethod ?? "—"}</span>
        <span>وضعیت: {item.status}</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button asChild size="sm" className="rounded-xl">
          <Link href={`/store/orders/${item.id}`}>جزئیات</Link>
        </Button>

        {item.paymentStatus === "PENDING" && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={() => onDelete(item.id)}
          >
            حذف
          </Button>
        )}
      </div>
    </div>
  );
}

export function OrdersScreen() {
  const [page, setPage] = useState(1);
  const [filterId, setFilterId] = useState("all");

  const filters: MyCheckoutsFilters = useMemo(() => {
    const chip = FILTERS.find((f) => f.id === filterId);
    return {
      page,
      limit: 10,
      order: "desc",
      paymentStatus: chip?.paymentStatus,
    };
  }, [page, filterId]);

  const { data, isLoading, isError, isFetching, refetch } =
    useMyCheckouts(filters);
  const deleteCheckout = useDeleteCheckout();

  const checkouts = data?.checkouts ?? [];
  const pagination = data?.pagination;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="rounded-full"
            >
              <Link href="/account" aria-label="بازگشت">
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Package className="size-5 text-primary" />
                سفارش‌های من
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                تسویه‌حساب‌های فروشگاه
                {isFetching ? " · در حال به‌روزرسانی…" : ""}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilterId(f.id);
                setPage(1);
              }}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                filterId === f.id
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : isError ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-muted-foreground">خطا در دریافت سفارش‌ها</p>
            <Button variant="outline" onClick={() => refetch()}>
              تلاش مجدد
            </Button>
          </div>
        ) : checkouts.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <ShoppingBag className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">هنوز سفارشی ندارید</p>
            <Button asChild>
              <Link href="/store">مشاهده فروشگاه</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {checkouts.map((item) => (
                <CheckoutCard
                  key={item.id}
                  item={item}
                  deleting={deleteCheckout.isPending}
                  onDelete={(id) => deleteCheckout.mutate(id)}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                قبلی
              </Button>
              <span className="text-sm tabular-nums text-muted-foreground">
                صفحه {page.toLocaleString("fa-IR")}
                {pagination?.total != null
                  ? ` · ${pagination.total.toLocaleString("fa-IR")} مورد`
                  : ""}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!pagination?.nextPage}
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
