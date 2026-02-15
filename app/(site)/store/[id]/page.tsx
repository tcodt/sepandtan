import { items } from "@/lib/products";
import { notFound } from "next/navigation";
import React from "react";
import ProductGallery from "./product-gallery";
import ProductInfo from "./product-info";
import ProductTabs from "./product-tabs";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = items.find((item) => item.id === +id);

  if (!product) return notFound();

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductGallery product={product} />
        <ProductInfo product={product} />
      </div>

      <div className="mt-12">
        <ProductTabs product={product} />
      </div>
    </div>
  );
}
