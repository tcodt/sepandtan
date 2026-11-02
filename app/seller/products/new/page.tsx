"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SellerProductForm } from "@/components/seller/seller-product-form";

export default function SellerNewProductPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/seller/products" aria-label="بازگشت">
            <ArrowRight className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">محصول جدید</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            ابتدا محصول را ثبت کنید، سپس واریانت‌ها را اضافه کنید
          </p>
        </div>
      </div>

      <SellerProductForm />
    </div>
  );
}
