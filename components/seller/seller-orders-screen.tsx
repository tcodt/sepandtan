"use client";

import { useMemo, useState } from "react";
import { Loader2, ShoppingBag } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useStoreOrders,
  useUpdateStoreOrderStatus,
} from "@/features/orders/hooks";
import type { OrderStatus, StoreOrdersFilters } from "@/features/orders/types";
import { useSellerStoreId } from "@/features/seller/use-store-id";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
];

function formatMoney(value: string) {
  const n = Number(value);
  if (!Number.isFinite(n)) return value;
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

export function SellerOrdersScreen() {
  const { storeId, isLoading: storeLoading } = useSellerStoreId();
  const [page, setPage] = useState(1);

  const filters: StoreOrdersFilters = useMemo(
    () => ({ page, limit: 10, order: "desc" }),
    [page],
  );

  const { data, isLoading, isError, refetch, isFetching } = useStoreOrders(
    storeId ?? "",
    filters,
    Boolean(storeId),
  );
  const updateStatus = useUpdateStoreOrderStatus();

  const orders = data?.orders ?? [];

  if (storeLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!storeId) {
    return (
      <div className="text-center py-16 space-y-3">
        <ShoppingBag className="mx-auto size-10 text-muted-foreground" />
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          شناسه فروشگاه پیدا نشد. بعد از ثبت حداقل یک محصول، یا افزودن{" "}
          <code className="text-xs">storeId</code> به پروفایل کاربر، سفارش‌ها
          اینجا نمایش داده می‌شوند.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShoppingBag className="size-5 text-primary" />
          سفارش‌های فروشگاه
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          storeId: <span className="font-mono">{storeId}</span>
          {isFetching ? " · در حال به‌روزرسانی…" : ""}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="text-center py-12 space-y-3">
          <p className="text-muted-foreground">خطا در دریافت سفارش‌ها</p>
          <Button variant="outline" onClick={() => refetch()}>
            تلاش مجدد
          </Button>
        </div>
      ) : orders.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          سفارشی یافت نشد
        </p>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-border bg-background p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {o.orderNumber}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(o.createdAt)}
                  </p>
                </div>
                <Badge variant="outline" className="text-[11px]">
                  {o.status}
                </Badge>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">مبلغ</span>
                <span className="font-bold tabular-nums">
                  {formatMoney(o.totalPrice)}
                </span>
              </div>

              {o.trackingCode && (
                <p className="text-xs text-muted-foreground">
                  رهگیری: {o.trackingCode}
                </p>
              )}
              {o.shippingName && (
                <p className="text-xs text-muted-foreground">
                  ارسال: {o.shippingName} · {formatMoney(o.shippingCost)}
                </p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">
                  تغییر وضعیت
                </span>
                <Select
                  value={o.status}
                  onValueChange={(status) =>
                    updateStatus.mutate({
                      orderId: o.id,
                      payload: {
                        status: status as OrderStatus,
                        storeId,
                      },
                    })
                  }
                >
                  <SelectTrigger className="h-9 flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
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
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={!data?.pagination.nextPage}
          onClick={() => setPage((p) => p + 1)}
        >
          بعدی
        </Button>
      </div>
    </div>
  );
}
