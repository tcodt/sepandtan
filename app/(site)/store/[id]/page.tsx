import type { Metadata } from "next";
import { items } from "@/lib/products";
import { notFound } from "next/navigation";
import ProductGallery from "../_components/product-gallery";
import ProductTabs from "../_components/product-tabs";
import { Product } from "@/lib/products-type";
import ProductInfo from "@/components/store/product-info";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = items.find((item) => item.id === +id);

  if (!product) {
    return {
      title: "محصول یافت نشد",
      description: "متأسفانه این محصول دیگر در دسترس نیست",
    };
  }

  return {
    title: `سپندتن | ${product.name}`,
    description: `${product.description}`,
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = items.find((item) => item.id === +id);

  if (!product) return notFound();

  return (
    <div className="container max-w-6xl mx-auto py-8 sm:py-10 px-4 sm:px-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <ProductGallery product={product as Product} />
        <ProductInfo product={product as Product} />
      </div>

      <div className="mt-12">
        <ProductTabs product={product as Product} />
      </div>
    </div>
  );
}
