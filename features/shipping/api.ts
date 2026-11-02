import { apiClient } from "@/lib/api/client";
import { asArray, asNumber, asString } from "@/features/catalog/utils";
import type { ShippingOption } from "./types";

function mapShippingOption(raw: unknown): ShippingOption | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;
  const method = (r.shippingMethod ?? r.method ?? {}) as Record<
    string,
    unknown
  >;
  return {
    id,
    storeId: asString(r.storeId) ?? "",
    shippingMethodId: asString(r.shippingMethodId) ?? asString(method.id) ?? "",
    isActive: r.isActive !== false,
    description: asString(r.description),
    phrase: asString(r.phrase),
    minDays: asNumber(r.minDays) ?? 0,
    maxDays: asNumber(r.maxDays) ?? 0,
    defaultPrice: asNumber(r.defaultPrice) ?? 0,
    methodName: asString(method.name) || asString(r.name),
  };
}

/**
 * GET /shipping/order/{provinceId}
 * روش‌های ارسال هر فروشنده متناسب با استان آدرس کاربر
 */
export async function fetchShippingForOrder(
  provinceId: string,
): Promise<ShippingOption[]> {
  const { data } = await apiClient.get(
    `/shipping/order/${encodeURIComponent(provinceId)}`,
  );
  return asArray(data)
    .map(mapShippingOption)
    .filter((x): x is ShippingOption => x !== null);
}

/** GET /shipping — لیست متدهای پایه (ادمین) */
export async function fetchShippingMethods(): Promise<
  Array<{ id: string; name: string; isActive: boolean; isFreeMethod: boolean }>
> {
  const { data } = await apiClient.get("/shipping");
  return asArray(data).map((raw) => {
    const r = (raw ?? {}) as Record<string, unknown>;
    return {
      id: asString(r.id) ?? "",
      name: asString(r.name) ?? "",
      isActive: r.isActive !== false,
      isFreeMethod: Boolean(r.isFreeMethod),
    };
  });
}
