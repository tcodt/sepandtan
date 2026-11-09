"use client";
import { ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SellerProductForm } from "@/components/seller/seller-product-form";
import { useRouter } from "next/navigation";

export default function SellerNewProductPage() {
  const router = useRouter();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => router.push("/seller/products")}
          aria-label="بازگشت به لیست محصولات"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold sm:text-xl">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Package className="h-4 w-4" aria-hidden="true" />
            </span>
            محصول جدید
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            ابتدا اطلاعات محصول را تکمیل کنید، سپس واریانت‌ها را اضافه نمایید.
          </p>
        </div>
      </div>

      <SellerProductForm />
    </div>
  );
}
