import type { PaginationMeta } from "@/features/catalog/types";

export type WishlistProduct = {
  id: string;
  title: string;
  slug: string;
  status: string;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  originalPrice: number | null;
  minPrice: number | null;
  discountPercent: number | null;
  brand: { name: string; slug: string } | null;
  category: { name: string; slug: string; icon: string | null };
  imageUrl: string | null;
};

export type WishlistItem = {
  id: string;
  createdAt: string;
  productId: string;
  product: WishlistProduct;
};

export type WishlistListResponse = {
  pagination: PaginationMeta;
  items: WishlistItem[];
};
