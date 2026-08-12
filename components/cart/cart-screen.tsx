"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";
import { CartItem } from "./cart-item";
import { CartSummary } from "./cart-summary";

export function CartScreen() {
  const items = useCartStore((s) => s.items);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild className="gap-1.5 -mr-2">
            <Link href="/store">
              <ArrowRight className="w-4 h-4" />
              فروشگاه
            </Link>
          </Button>
          <h1 className="text-lg font-bold text-foreground">سبد خرید</h1>
          <div className="w-16" />
        </div>

        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-16 px-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold text-foreground">سبد خرید خالی است</p>
              <p className="text-sm text-muted-foreground mt-1">
                از فروشگاه محصولی اضافه کن
              </p>
            </div>
            <Button asChild className="rounded-full">
              <Link href="/store">مشاهده فروشگاه</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <CartItem
                  key={`${item.productId}-${item.size ?? "default"}`}
                  item={item}
                />
              ))}
            </div>
            <CartSummary />
          </>
        )}
      </div>
    </div>
  );
}
