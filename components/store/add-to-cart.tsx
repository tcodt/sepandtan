"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/products-type";
import { useCartStore } from "@/lib/store/cart-store";
import { useUserStore } from "@/lib/store/user-store";
import { useRouter } from "next/navigation";

type AddToCartProps = {
  product: Product;
  size?: string | null;
  className?: string;
};

export default function AddToCart({
  product,
  size,
  className,
}: AddToCartProps) {
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);
  const loggedIn = useUserStore((s) => s.isAuthenticated && !!s.user);
  const router = useRouter();

  const handleAdd = () => {
    if (!product.inStock) return;
    if (!loggedIn) {
      toast.error("ابتدا وارد شو");
      router.push("/login");
      return;
    }

    // برای لباس، اگر سایز لازم است و انتخاب نشده
    if ("sizes" in product && product.sizes?.length && !size) {
      toast.error("لطفاً سایز را انتخاب کن");
      return;
    }

    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      inStock: product.inStock,
      size: size || undefined,
    });

    setJustAdded(true);
    toast.success("به سبد خرید اضافه شد", {
      action: {
        label: "مشاهده سبد",
        onClick: () => {
          window.location.href = "/cart";
        },
      },
    });

    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className={`space-y-2 ${className ?? ""}`}>
      <Button
        size="lg"
        className="w-full h-12 text-base gap-2 rounded-xl"
        disabled={!product.inStock}
        onClick={handleAdd}
      >
        {justAdded ? (
          <>
            <Check className="w-5 h-5" />
            اضافه شد
          </>
        ) : (
          <>
            <ShoppingCart className="w-5 h-5" />
            افزودن به سبد خرید
          </>
        )}
      </Button>

      {justAdded && (
        <Button asChild variant="outline" className="w-full rounded-xl">
          <Link href="/cart">رفتن به سبد خرید</Link>
        </Button>
      )}
    </div>
  );
}
