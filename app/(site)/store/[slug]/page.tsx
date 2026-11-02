import ProductDetailClient from "@/components/store/product-detail-client";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `سپندتن | ${slug}`,
    description: "جزئیات محصول",
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailClient idOrSlug={slug} />;
}
