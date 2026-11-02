import { apiClient } from "@/lib/api/client";
import { asArray, asString } from "@/features/catalog/utils";

export async function fetchWishlistIds(): Promise<string[]> {
  const { data } = await apiClient.get("/wishlist/ids");
  if (Array.isArray(data)) {
    return data.map((x) => asString(x)).filter(Boolean) as string[];
  }
  const r = (data ?? {}) as Record<string, unknown>;
  return asArray(r.ids ?? r.data ?? r.productIds)
    .map((x) => asString(x))
    .filter(Boolean) as string[];
}

export async function addToWishlist(productId: string): Promise<void> {
  await apiClient.post(`/wishlist/${productId}`);
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiClient.delete(`/wishlist/${productId}`);
}
