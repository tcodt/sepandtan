"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart-store";

export function CartSummary() {
  const totalPrice = useCartStore((s) => s.totalPrice);
  const totalItems = useCartStore((s) => s.totalItems);
  const clearCart = useCartStore((s) => s.clearCart);
  const items = useCartStore((s) => s.items);

  const handleCheckout = () => {
    // ==================== MOCK ====================
    // بعداً: اتصال به درگاه / ایجاد سفارش
    // ==============================================
    toast.success("سفارش با موفقیت ثبت شد (آزمایشی)");
    clearCart();
  };

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-muted/50 p-4 sm:p-5 space-y-4 sticky bottom-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">تعداد اقلام</span>
        <span className="font-medium tabular-nums">
          {totalItems().toLocaleString("fa-IR")}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">جمع کل</span>
        <span className="text-lg font-bold text-foreground tabular-nums">
          {totalPrice().toLocaleString("fa-IR")} تومان
        </span>
      </div>

      <Button className="w-full h-11 text-base" onClick={handleCheckout}>
        ادامه و ثبت سفارش
      </Button>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          clearCart();
          toast.message("سبد خرید خالی شد");
        }}
      >
        خالی کردن سبد
      </Button>
    </div>
  );
}
