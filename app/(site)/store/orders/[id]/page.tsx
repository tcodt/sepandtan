"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckoutDetail, usePayCheckout } from "@/features/orders/hooks";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function StoreOrderDetailPage() {
  const { isLoading: authLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: false,
  });
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const pay = usePayCheckout();

  const { data, isLoading, isError } = useCheckoutDetail(
    id,
    isAuthenticated && Boolean(id),
  );

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (isError || !data) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-muted-foreground">سفارش پیدا نشد</p>
        <Button asChild variant="outline">
          <Link href="/store">فروشگاه</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div>
        <h1 className="text-xl font-bold">سفارش ثبت شد</h1>
        <p className="text-sm text-muted-foreground mt-1">
          شماره تسویه:{" "}
          <span className="font-medium text-foreground">
            {data.checkoutNumber || data.id}
          </span>
        </p>
      </div>

      <div className="rounded-2xl border border-border p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">وضعیت پرداخت</span>
          <span>{data.paymentStatus}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">مبلغ</span>
          <span className="tabular-nums font-semibold">
            {Number(data.totalAmount).toLocaleString("fa-IR")} تومان
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">روش پرداخت</span>
          <span>{data.paymentMethod ?? "—"}</span>
        </div>
      </div>

      {data.orders?.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold">سفارش‌های فروشگاه‌ها</h2>
          {data.orders.map((o) => (
            <div
              key={o.id}
              className="rounded-xl border border-border p-3 text-sm space-y-1"
            >
              <p className="font-medium">{o.storeName}</p>
              <p className="text-xs text-muted-foreground">
                {o.orderNumber} · {o.status}
              </p>
              <p className="tabular-nums">
                {Number(o.totalPrice).toLocaleString("fa-IR")} تومان
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {data.paymentStatus === "PENDING" && (
          <Button disabled={pay.isPending} onClick={() => pay.mutate(data.id)}>
            {pay.isPending ? "در حال پرداخت..." : "پرداخت مجدد"}
          </Button>
        )}
        <Button asChild>
          <Link href="/store">ادامه خرید</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/cart">سبد خرید</Link>
        </Button>
      </div>
    </div>
  );
}
