"use client";

import Link from "next/link";
import { Package, ShoppingBag } from "lucide-react";
import { useAdminProducts } from "@/features/products/hooks";

export default function SellerHomePage() {
  const { data, isLoading } = useAdminProducts({ page: 1, limit: 5 });

  const products = data?.products ?? [];
  const total = data?.pagination.total ?? products.length;
  const pending = products.filter((p) => p.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">نمای کلی فروشنده</h1>
        <p className="text-sm text-muted-foreground mt-1">
          مدیریت محصولات و سفارش‌های فروشگاه شما
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/seller/products"
          className="rounded-2xl border border-border bg-background p-4 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Package className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">محصولات</p>
              <p className="text-xs text-muted-foreground">
                {isLoading ? "..." : `${total.toLocaleString("fa-IR")} محصول`}
                {!isLoading && pending > 0
                  ? ` · ${pending.toLocaleString("fa-IR")} در انتظار تأیید`
                  : ""}
              </p>
            </div>
          </div>
        </Link>

        <Link
          href="/seller/orders"
          className="rounded-2xl border border-border bg-background p-4 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingBag className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">سفارش‌ها</p>
              <p className="text-xs text-muted-foreground">
                پیگیری و به‌روزرسانی وضعیت ارسال
              </p>
            </div>
          </div>
        </Link>
      </div>

      <section className="rounded-2xl border border-border bg-background p-4 space-y-3">
        <h2 className="text-sm font-semibold">آخرین محصولات</h2>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">در حال بارگذاری...</p>
        ) : products.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            هنوز محصولی ثبت نشده. از بخش محصولات شروع کنید.
          </p>
        ) : (
          <ul className="space-y-2">
            {products.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 text-sm border-b border-border/60 pb-2 last:border-0"
              >
                <span className="truncate font-medium">{p.title}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
