"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  totalItems: number;
  totalPrice: number;
};

export function CartSummary({ totalItems, totalPrice }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-muted/50 p-4 sm:p-5 space-y-4 sticky bottom-4">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">تعداد اقلام</span>
        <span className="font-medium tabular-nums">
          {totalItems.toLocaleString("fa-IR")}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">جمع کل</span>
        <span className="text-lg font-bold tabular-nums">
          {totalPrice.toLocaleString("fa-IR")} تومان
        </span>
      </div>

      <Button asChild className="w-full h-11 text-base">
        <Link href="/store/checkout">ادامه و ثبت سفارش</Link>
      </Button>
    </div>
  );
}
