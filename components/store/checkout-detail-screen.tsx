"use client";

import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  Loader2,
  MapPin,
  Package,
  RefreshCw,
  Store,
  Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useCheckoutDetail, usePayCheckout } from "@/features/orders/hooks";
import type { CheckoutDetail, Order } from "@/features/orders/types";

/* -------------------------------------------------------------------------- */
/* Labels                                                                     */
/* -------------------------------------------------------------------------- */

const paymentStatusLabel: Record<string, string> = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  REFUNDED: "استرداد",
  FAILED: "ناموفق",
};

const paymentMethodLabel: Record<string, string> = {
  zarinpal: "زرین‌پال",
  card: "کارت به کارت",
  cod: "پرداخت در محل",
  wallet: "کیف پول",
};

const orderStatusLabel: Record<string, string> = {
  PENDING: "در انتظار",
  CONFIRMED: "تأیید‌شده",
  PROCESSING: "در حال آماده‌سازی",
  SHIPPED: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELLED: "لغو‌شده",
  RETURNED: "مرجوعی",
};

function statusTone(status: string) {
  const s = status.toUpperCase();
  if (s === "PAID" || s === "DELIVERED" || s === "CONFIRMED") {
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400";
  }
  if (s === "PENDING" || s === "PROCESSING" || s === "SHIPPED") {
    return "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400";
  }
  if (s === "FAILED" || s === "CANCELLED" || s === "REFUNDED") {
    return "bg-destructive/10 text-destructive border-destructive/20";
  }
  return "bg-muted text-muted-foreground border-border";
}

function formatMoney(value: string | number | null | undefined) {
  if (value == null || value === "") return "—";
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  return `${n.toLocaleString("fa-IR")} تومان`;
}

function formatDate(iso: string | null | undefined) {
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

/* -------------------------------------------------------------------------- */
/* Sub components                                                             */
/* -------------------------------------------------------------------------- */

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: React.ReactNode;
  strong?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span
        className={cn(
          "min-w-0 text-end",
          strong
            ? "font-semibold tabular-nums text-foreground"
            : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function StoreOrderCard({ order }: { order: Order }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card/80 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Store className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="truncate">{order.storeName || "فروشگاه"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {order.orderNumber || order.id}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[11px]", statusTone(order.status))}
        >
          {orderStatusLabel[order.status] ?? order.status}
        </Badge>
      </div>

      {order.shippingName && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Truck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span>
            {order.shippingName}
            {order.shippingCost
              ? ` · ${formatMoney(order.shippingCost)}`
              : null}
          </span>
        </div>
      )}

      {order.trackingCode ? (
        <p className="text-xs text-muted-foreground">
          کد پیگیری:{" "}
          <span className="font-medium text-foreground" dir="ltr">
            {order.trackingCode}
          </span>
        </p>
      ) : null}

      {order.items && order.items.length > 0 && (
        <ul className="space-y-2 border-t border-border/60 pt-3">
          {order.items.map((item, idx) => (
            <li
              key={`${item.productId}-${item.sku}-${idx}`}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {item.quantity.toLocaleString("fa-IR")} ×{" "}
                  {formatMoney(item.price)}
                  {item.colorName ? ` · ${item.colorName}` : ""}
                </p>
                {item.attributes?.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {item.attributes
                      .map((a) => `${a.label || a.key}: ${a.value}`)
                      .join(" · ")}
                  </p>
                )}
              </div>
              <span className="shrink-0 tabular-nums text-xs font-medium">
                {formatMoney(item.total)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Separator />

      <div className="space-y-1.5">
        <Row label="جمع جزء" value={formatMoney(order.subtotal)} />
        {Number(order.discountAmount) > 0 && (
          <Row label="تخفیف" value={formatMoney(order.discountAmount)} />
        )}
        <Row label="جمع فروشگاه" value={formatMoney(order.totalPrice)} strong />
      </div>

      {order.note && order.note !== "—" && (
        <p className="text-xs text-muted-foreground">یادداشت: {order.note}</p>
      )}
    </div>
  );
}

function CheckoutBody({
  data,
  onPay,
  paying,
}: {
  data: CheckoutDetail;
  onPay: () => void;
  paying: boolean;
}) {
  const isPending = data.paymentStatus.toUpperCase() === "PENDING";
  const methodKey = (data.paymentMethod ?? "").toLowerCase();

  const hasAddress = Boolean(
    data.shippingAddress ||
    data.shippingCity ||
    data.shippingProvince ||
    data.shippingName,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="mt-0.5 shrink-0 rounded-full"
          >
            <Link href="/account/orders" aria-label="بازگشت به سفارش‌ها">
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <div>
            <h1 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
              <Package className="size-5 text-primary" aria-hidden />
              جزئیات سفارش
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">
              شماره تسویه:{" "}
              <span className="font-medium text-foreground">
                {data.checkoutNumber || data.id}
              </span>
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDate(data.createdAt)}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn("shrink-0 text-[11px]", statusTone(data.paymentStatus))}
        >
          {paymentStatusLabel[data.paymentStatus] ?? data.paymentStatus}
        </Badge>
      </div>

      {/* Payment summary */}
      <section className="space-y-3 rounded-2xl border border-border bg-card/80 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <CreditCard className="size-4 text-primary" aria-hidden />
          پرداخت
        </h2>
        <div className="space-y-2">
          <Row
            label="روش پرداخت"
            value={paymentMethodLabel[methodKey] ?? data.paymentMethod ?? "—"}
          />
          <Row
            label="وضعیت پرداخت"
            value={paymentStatusLabel[data.paymentStatus] ?? data.paymentStatus}
          />
          {data.paymentRef && (
            <Row
              label="کد پیگیری پرداخت"
              value={
                <span dir="ltr" className="break-all">
                  {data.paymentRef}
                </span>
              }
            />
          )}
          {Number(data.discountAmount) > 0 && (
            <Row label="تخفیف" value={formatMoney(data.discountAmount)} />
          )}
          {data.taxAmount != null && Number(data.taxAmount) > 0 && (
            <Row label="مالیات" value={formatMoney(data.taxAmount)} />
          )}
          <Separator />
          <Row label="مبلغ کل" value={formatMoney(data.totalAmount)} strong />
        </div>
      </section>

      {/* Shipping address */}
      {hasAddress && (
        <section className="space-y-3 rounded-2xl border border-border bg-card/80 p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MapPin className="size-4 text-primary" aria-hidden />
            آدرس تحویل
          </h2>
          <div className="space-y-1 text-sm text-muted-foreground">
            {data.shippingName && (
              <p className="font-medium text-foreground">{data.shippingName}</p>
            )}
            {data.shippingPhone && <p dir="ltr">{data.shippingPhone}</p>}
            <p>
              {[data.shippingProvince, data.shippingCity]
                .filter(Boolean)
                .join("، ")}
            </p>
            {data.shippingAddress && <p>{data.shippingAddress}</p>}
            {data.shippingPostal && (
              <p>
                کد پستی: <span dir="ltr">{data.shippingPostal}</span>
              </p>
            )}
          </div>
        </section>
      )}

      {/* Per-store orders */}
      {data.orders?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">
            سفارش‌های فروشگاه‌ها ({data.orders.length.toLocaleString("fa-IR")})
          </h2>
          <div className="space-y-3">
            {data.orders.map((o) => (
              <StoreOrderCard key={o.id} order={o} />
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {isPending && (
          <Button
            className="gap-2 rounded-xl"
            disabled={paying}
            onClick={onPay}
          >
            {paying ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CreditCard className="size-4" />
            )}
            پرداخت
          </Button>
        )}
        <Button asChild variant="outline" className="rounded-xl">
          <Link href="/account/orders">همه سفارش‌ها</Link>
        </Button>
        <Button asChild variant="secondary" className="rounded-xl">
          <Link href="/store">ادامه خرید</Link>
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

type Props = {
  checkoutId: string;
};

export function CheckoutDetailScreen({ checkoutId }: Props) {
  const { data, isLoading, isError, isFetching, refetch } = useCheckoutDetail(
    checkoutId,
    Boolean(checkoutId),
  );
  const pay = usePayCheckout();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-16 text-center">
        <p className="text-muted-foreground">سفارش پیدا نشد یا دسترسی ندارید</p>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => void refetch()}
          >
            <RefreshCw className={cn("size-4", isFetching && "animate-spin")} />
            تلاش مجدد
          </Button>
          <Button asChild variant="secondary">
            <Link href="/account/orders">سفارش‌های من</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <CheckoutBody
        data={data}
        paying={pay.isPending}
        onPay={() => pay.mutate(data.id)}
      />
    </div>
  );
}
