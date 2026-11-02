"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/features/cart/types";
import { useRemoveCartItem, useUpdateCartItem } from "@/features/cart/hooks";

export function CartItemRow({ item }: { item: CartItem }) {
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();

  return (
    <div className="flex gap-3 p-3 sm:p-4 rounded-2xl border border-border bg-muted/50">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-muted/40 overflow-hidden shrink-0">
        {item.product.imageUrl && (
          <Image
            src={item.product.imageUrl}
            alt={item.product.title}
            fill
            className="object-contain p-2"
            sizes="96px"
          />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <p className="text-sm font-semibold line-clamp-2">
            {item.product.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {item.variant.name}
            {item.variant.colorName ? ` · ${item.variant.colorName}` : ""}
          </p>
          <p className="text-sm font-bold mt-1 tabular-nums">
            {item.totalPrice.toLocaleString("fa-IR")} تومان
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  itemId: item.id,
                  payload: { quantity: Math.max(1, item.quantity - 1) },
                })
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
              disabled={update.isPending}
              onClick={() =>
                update.mutate({
                  itemId: item.id,
                  payload: { quantity: item.quantity + 1 },
                })
              }
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            disabled={remove.isPending}
            onClick={() => remove.mutate(item.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
