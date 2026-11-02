import { apiClient } from "@/lib/api/client";
import {
  asArray,
  asNumber,
  asString,
  resolveMediaUrl,
} from "@/features/catalog/utils";
import type {
  AddToCartInput,
  Cart,
  CartItem,
  CartProduct,
  CartVariant,
  StoreCartGroup,
  UpdateCartItemInput,
} from "./types";

function mapVariant(raw: unknown): CartVariant {
  const r = (raw ?? {}) as Record<string, unknown>;
  const color = r.color as Record<string, unknown> | null | undefined;
  const discount = r.discount as Record<string, unknown> | null | undefined;
  const attrs = asArray(r.attributes).map((a) => {
    const ar = (a ?? {}) as Record<string, unknown>;
    const def = (ar.attribute ?? {}) as Record<string, unknown>;
    return {
      id: asString(ar.id) ?? "",
      value: asString(ar.value) ?? "",
      key: asString(def.key) ?? undefined,
      label: asString(def.label) ?? undefined,
    };
  });

  return {
    id: asString(r.id) ?? "",
    name: asString(r.name) ?? "",
    sku: asString(r.sku),
    price: asNumber(r.price) ?? 0,
    colorName: color ? asString(color.name) : null,
    attributes: attrs,
    discount: discount
      ? {
          id: asString(discount.id) ?? "",
          isActive: Boolean(discount.isActive),
          value: asString(discount.value) ?? "",
          type: asString(discount.type) ?? "",
          endsAt: asString(discount.endsAt),
        }
      : null,
  };
}

function mapProduct(raw: unknown): CartProduct {
  const r = (raw ?? {}) as Record<string, unknown>;
  const store = (r.store ?? {}) as Record<string, unknown>;
  const images = asArray(r.images);
  const first = (images[0] ?? {}) as Record<string, unknown>;
  const path = asString(first.url) || asString(first.path);

  return {
    id: asString(r.id) ?? "",
    storeId: asString(r.storeId) ?? asString(store.id) ?? "",
    title: asString(r.title) ?? "",
    slug: asString(r.slug) ?? "",
    storeName: asString(store.name) ?? "",
    storeSlug: asString(store.slug) ?? "",
    commissionRate: asString(store.commissionRate) ?? "0",
    imagePath: path,
    imageUrl: path ? resolveMediaUrl(path) : null,
  };
}

function mapCartItem(raw: unknown): CartItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;
  return {
    id,
    quantity: asNumber(r.quantity) ?? 1,
    createdAt: asString(r.createdAt) ?? "",
    variantId: asString(r.variantId) ?? "",
    product: mapProduct(r.product),
    variant: mapVariant(r.variant),
    totalPrice: asNumber(r.totalPrice) ?? 0,
    totalDiscount: asNumber(r.totalDiscount) ?? 0,
  };
}

function mapCart(raw: unknown): Cart {
  const r = (raw ?? {}) as Record<string, unknown>;
  const storesRaw = asArray(r.stores);
  const stores: StoreCartGroup[] = storesRaw.map((s) => {
    const sr = (s ?? {}) as Record<string, unknown>;
    const items = asArray(sr.carts ?? sr.items)
      .map(mapCartItem)
      .filter((x): x is CartItem => x !== null);
    return {
      storeId: asString(sr.storeId) ?? "",
      storeName: asString(sr.storeName) ?? "",
      storeSlug: asString(sr.storeSlug) ?? "",
      commissionRate: asString(sr.commissionRate) ?? "0",
      items,
    };
  });

  return {
    totalItems:
      asNumber(r.totalItems) ?? stores.reduce((n, s) => n + s.items.length, 0),
    totalPrice: asNumber(r.totalPrice) ?? 0,
    stores,
  };
}

/** GET /cart */
export async function fetchCart(): Promise<Cart> {
  const { data } = await apiClient.get("/cart");
  return mapCart(data);
}

/** POST /cart */
export async function addToCart(payload: AddToCartInput): Promise<unknown> {
  const { data } = await apiClient.post("/cart", {
    productId: payload.productId,
    variantId: payload.variantId,
    quantity: payload.quantity ?? 1,
  });
  return data;
}

/** PUT /cart/{id} */
export async function updateCartItem(
  itemId: string,
  payload: UpdateCartItemInput,
): Promise<unknown> {
  const { data } = await apiClient.put(`/cart/${itemId}`, payload);
  return data;
}

/** DELETE /cart/{id} */
export async function removeCartItem(itemId: string): Promise<void> {
  await apiClient.delete(`/cart/${itemId}`);
}

/** DELETE /cart */
export async function clearCart(): Promise<void> {
  await apiClient.delete("/cart");
}
