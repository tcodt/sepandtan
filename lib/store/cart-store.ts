"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  size?: string;
  inStock: boolean;
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (productId: number, size?: string) => void;
  updateQuantity: (productId: number, quantity: number, size?: string) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

function sameLine(a: CartItem, productId: number, size?: string) {
  return a.productId === productId && (a.size ?? "") === (size ?? "");
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const qty = item.quantity ?? 1;
        const items = get().items;
        const idx = items.findIndex((i) =>
          sameLine(i, item.productId, item.size),
        );

        if (idx >= 0) {
          const next = [...items];
          next[idx] = {
            ...next[idx],
            quantity: next[idx].quantity + qty,
          };
          set({ items: next });
          return;
        }

        set({
          items: [
            ...items,
            {
              productId: item.productId,
              name: item.name,
              price: item.price,
              image: item.image,
              inStock: item.inStock,
              size: item.size,
              quantity: qty,
            },
          ],
        });
      },

      removeItem: (productId, size) => {
        set({
          items: get().items.filter((i) => !sameLine(i, productId, size)),
        });
      },

      updateQuantity: (productId, quantity, size) => {
        if (quantity <= 0) {
          get().removeItem(productId, size);
          return;
        }
        set({
          items: get().items.map((i) =>
            sameLine(i, productId, size) ? { ...i, quantity } : i,
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "sepandtan-cart" },
  ),
);
