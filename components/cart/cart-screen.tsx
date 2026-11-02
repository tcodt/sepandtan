"use client";

import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCart, useClearCart } from "@/features/cart/hooks";
import { CartItemRow } from "./cart-item";
import { CartSummary } from "./cart-summary";

export function CartScreen() {
  const { data: cart, isLoading, isError, refetch } = useCart();
  const clearCart = useClearCart();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-16 space-y-3">
        <p className="text-muted-foreground">خطا در دریافت سبد</p>
        <Button variant="outline" onClick={() => refetch()}>
          تلاش مجدد
        </Button>
      </div>
    );
  }

  const stores = cart?.stores ?? [];
  const isEmpty = !cart || cart.totalItems === 0 || stores.length === 0;

  if (isEmpty) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-muted-foreground">سبد خرید خالی است</p>
        <Button asChild>
          <Link href="/store">مشاهده فروشگاه</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">سبد خرید</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => clearCart.mutate()}
          disabled={clearCart.isPending}
        >
          خالی کردن
        </Button>
      </div>

      {stores.map((store) => (
        <section key={store.storeId} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {store.storeName}
          </h2>
          <div className="space-y-3">
            {store.items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}

      <CartSummary totalItems={cart.totalItems} totalPrice={cart.totalPrice} />
    </div>
  );
}
