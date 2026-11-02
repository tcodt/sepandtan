"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, Star } from "lucide-react";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProductDetail } from "@/features/products/hooks";
import { useProductVariants } from "@/features/variants/hooks";
import { useAddToCart } from "@/features/cart/hooks";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { resolveMediaUrl } from "@/features/catalog/utils";
import { asString, asNumber } from "@/features/catalog/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Props = { idOrSlug: string };

export default function ProductDetailClient({ idOrSlug }: Props) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { data, isLoading, isError } = useProductDetail(idOrSlug);
  const productId =
    asString((data as Record<string, unknown> | undefined)?.id) ?? "";
  const { data: variants = [], isLoading: variantsLoading } =
    useProductVariants(productId, Boolean(productId));
  const addToCart = useAddToCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    null,
  );

  const activeVariant = useMemo(() => {
    if (!variants.length) return null;
    if (selectedVariantId) {
      return variants.find((v) => v.id === selectedVariantId) ?? variants[0];
    }
    return variants[0];
  }, [variants, selectedVariantId]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    notFound();
  }

  const r = data as Record<string, unknown>;
  const title = asString(r.title) ?? "محصول";
  const description = asString(r.description) ?? "";
  const images = Array.isArray(r.images) ? r.images : [];
  const firstImg = images[0] as Record<string, unknown> | undefined;
  const imagePath = asString(firstImg?.url) ?? asString(firstImg?.path);
  const imageUrl = imagePath
    ? resolveMediaUrl(imagePath)
    : "/images/placeholder-product.png";
  const rating = asNumber(r.rating) ?? 0;
  const reviewCount = asNumber(r.reviewCount) ?? 0;

  const price = activeVariant?.price ?? asNumber(r.minPrice);
  const quantity = activeVariant?.quantity ?? 0;

  const handleAdd = async () => {
    if (!isAuthenticated) {
      toast.error("ابتدا وارد شو");
      router.push("/login");
      return;
    }
    if (!productId || !activeVariant?.id) {
      toast.error("واریانت محصول موجود نیست");
      return;
    }
    if (quantity <= 0) {
      toast.error("این واریانت موجود نیست");
      return;
    }
    await addToCart.mutateAsync({
      productId,
      variantId: activeVariant.id,
      quantity: 1,
    });
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="relative aspect-square rounded-2xl bg-muted/40 overflow-hidden">
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-contain p-6"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="space-y-5">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="tabular-nums">{rating}</span>
              <span>·</span>
              <span>{reviewCount.toLocaleString("fa-IR")} نظر</span>
            </div>
          </div>

          {description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          )}

          <div>
            <p className="text-2xl font-bold tabular-nums">
              {price != null
                ? `${Number(price).toLocaleString("fa-IR")} تومان`
                : "—"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              موجودی: {quantity.toLocaleString("fa-IR")}
            </p>
          </div>

          {variantsLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : variants.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">انتخاب واریانت</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariantId(v.id)}
                    className={`rounded-xl border px-3 py-2 text-xs transition-colors ${
                      (activeVariant?.id ?? "") === v.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    <span className="font-medium">{v.name}</span>
                    {v.color?.name && (
                      <span className="text-muted-foreground ms-1">
                        · {v.color.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <Badge variant="secondary">واریانت ثبت نشده</Badge>
          )}

          <Button
            size="lg"
            className="w-full h-12 rounded-xl"
            disabled={!activeVariant || quantity <= 0 || addToCart.isPending}
            onClick={handleAdd}
          >
            {addToCart.isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "افزودن به سبد خرید"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
