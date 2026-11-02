import { apiClient } from "@/lib/api/client";
import type { Cart } from "@/features/cart/types";
import type { ValidateDiscountInput } from "./types";

/** تبدیل Cart فعلی به بدنه validate */
export function cartToValidatePayload(
  code: string,
  cart: Cart,
): ValidateDiscountInput {
  return {
    code,
    stores: cart.stores.map((s) => ({
      storeId: s.storeId,
      storeName: s.storeName,
      storeSlug: s.storeSlug,
      commissionRate: s.commissionRate,
      carts: s.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        createdAt: item.createdAt,
        variantId: item.variantId,
        product: {
          id: item.product.id,
          storeId: item.product.storeId,
          title: item.product.title,
          slug: item.product.slug,
          store: {
            commissionRate: item.product.commissionRate,
            name: item.product.storeName,
            slug: item.product.storeSlug,
          },
          images: item.product.imagePath
            ? [{ url: item.product.imagePath }]
            : [],
        },
        variant: {
          name: item.variant.name,
          id: item.variant.id,
          color: item.variant.colorName
            ? { name: item.variant.colorName }
            : null,
          price: String(item.variant.price),
          sku: item.variant.sku ?? undefined,
          attributes: item.variant.attributes.map((a) => a.value),
          discount: item.variant.discount
            ? {
                ...item.variant.discount,
                endsAt: item.variant.discount.endsAt ?? undefined,
              }
            : null,
        },
        totalPrice: item.totalPrice,
        totalDiscount: item.totalDiscount,
      })),
    })),
  };
}

/** POST /discounts/validate */
export async function validateDiscountCode(
  payload: ValidateDiscountInput,
): Promise<unknown> {
  const { data } = await apiClient.post("/discounts/validate", payload);
  return data;
}
