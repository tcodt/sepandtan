"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem as CartItemType } from "@/lib/store/cart-store";
import { useCartStore } from "@/lib/store/cart-store";

type CartItemProps = {
  item: CartItemType;
};

export function CartItem({ item }: CartItemProps) {
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  return (
    <div className="flex gap-3 p-3 sm:p-4 rounded-2xl border border-border bg-card/80 dark:bg-card/60">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-muted/40 overflow-hidden shrink-0">
        <Image
          src={item.image}
          alt={item.name}
          fill
          className="object-contain p-2"
          sizes="96px"
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground line-clamp-2">
            {item.name}
          </p>
          {item.size && (
            <p className="text-xs text-muted-foreground mt-0.5">
              سایز: {item.size}
            </p>
          )}
          <p className="text-sm font-bold text-foreground mt-1 tabular-nums">
            {item.price.toLocaleString("fa-IR")} تومان
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() =>
                updateQuantity(item.productId, item.quantity - 1, item.size)
              }
            >
              <Minus className="w-3.5 h-3.5" />
            </Button>
            <span className="w-6 text-center text-sm tabular-nums">
              {item.quantity}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              onClick={() =>
                updateQuantity(item.productId, item.quantity + 1, item.size)
              }
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => removeItem(item.productId, item.size)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
