/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { ShoppingCartIcon } from "lucide-react";
import { useState } from "react";

export default function AddToCart({ product }: { product: any }) {
  const [added, setAdded] = useState(false);

  return (
    <Button
      size="lg"
      className="mt-4 flex gap-2"
      disabled={!product.inStock}
      onClick={() => setAdded(true)}
    >
      <ShoppingCartIcon />
      {added ? "به سبد اضافه شد" : "افزودن به سبد خرید"}
    </Button>
  );
}
