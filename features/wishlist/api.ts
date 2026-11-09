import { apiClient } from "@/lib/api/client";
import {
  asArray,
  asNumber,
  asString,
  mapPagination,
  resolveMediaUrl,
} from "@/features/catalog/utils";
import type {
  WishlistItem,
  WishlistListResponse,
  WishlistProduct,
} from "./types";

function mapWishlistProduct(raw: unknown): WishlistProduct | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const title = asString(r.title);
  const slug = asString(r.slug);
  if (!id || !title || !slug) return null;

  const brand = r.brand as Record<string, unknown> | null | undefined;
  const category = (r.category ?? {}) as Record<string, unknown>;
  const images = Array.isArray(r.images) ? r.images : [];
  const first = images[0] as Record<string, unknown> | undefined;
  const imgPath = asString(first?.url) || asString(first?.path) || null;

  return {
    id,
    title,
    slug,
    status: asString(r.status) ?? "",
    isFeatured: Boolean(r.isFeatured),
    rating: asNumber(r.rating) ?? 0,
    reviewCount: asNumber(r.reviewCount) ?? 0,
    originalPrice: asNumber(r.originalPrice),
    minPrice: asNumber(r.minPrice),
    discountPercent: asNumber(r.discountPercent),
    brand: brand
      ? {
          name: asString(brand.name) ?? "",
          slug: asString(brand.slug) ?? "",
        }
      : null,
    category: {
      name: asString(category.name) ?? "",
      slug: asString(category.slug) ?? "",
      icon: asString(category.icon),
    },
    imageUrl: imgPath ? resolveMediaUrl(imgPath) : null,
  };
}

function mapWishlistItem(raw: unknown): WishlistItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const productId = asString(r.productId);
  if (!id || !productId) return null;
  const product = mapWishlistProduct(r.product);
  if (!product) return null;

  return {
    id,
    createdAt: asString(r.createdAt) ?? "",
    productId,
    product,
  };
}

/** GET /wishlist/ids */
export async function fetchWishlistIds(): Promise<string[]> {
  const { data } = await apiClient.get("/wishlist/ids");

  if (Array.isArray(data)) {
    return data
      .map((x) => asString(x))
      .filter((id): id is string => Boolean(id));
  }

  const r = (data ?? {}) as Record<string, unknown>;
  return asArray(r.ids ?? r.data ?? r.productIds)
    .map((x) => asString(x))
    .filter((id): id is string => Boolean(id));
}

/**
 * GET /wishlist?page= — page required by swagger
 */
export async function fetchWishlistPage(
  page = 1,
): Promise<WishlistListResponse> {
  const { data } = await apiClient.get("/wishlist", {
    params: { page },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.wishlist ?? r.data ?? r.items);

  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    items: list
      .map(mapWishlistItem)
      .filter((x): x is WishlistItem => x !== null),
  };
}

/** POST /wishlist/{productId} */
export async function addToWishlist(productId: string): Promise<void> {
  await apiClient.post(`/wishlist/${encodeURIComponent(productId)}`);
}

/** DELETE /wishlist/{productId} */
export async function removeFromWishlist(productId: string): Promise<void> {
  await apiClient.delete(`/wishlist/${encodeURIComponent(productId)}`);
}
