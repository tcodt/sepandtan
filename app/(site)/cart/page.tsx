import { CartClient } from "@/components/cart/cart-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "سپندتن | سبد خرید",
  description: "سبد خرید محصولات ورزشی سپندتن",
};

export default function CartPage() {
  return <CartClient />;
}
