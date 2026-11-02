"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SellerProductEditForm } from "@/components/seller/seller-product-edit-form";

export default function SellerEditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = params?.id ?? "";

  if (!productId) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        شناسه محصول نامعتبر است
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="icon" className="rounded-full">
          <Link href="/seller/products" aria-label="بازگشت">
            <ArrowRight className="size-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">ویرایش محصول</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono dir-ltr">
            {productId}
          </p>
        </div>
      </div>

      <SellerProductEditForm productId={productId} />
    </div>
  );
}
