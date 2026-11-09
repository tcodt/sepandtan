import { apiClient } from "@/lib/api/client";
import type {
  CreateStoreShippingInput,
  ProvinceOption,
  ShippingMethod,
  ShippingRate,
  StoreShippingMethod,
  UpdateStoreShippingInput,
  UpsertShippingRateInput,
  ShippingOption,
} from "./types";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) {
    return Number(v);
  }
  return null;
}

function asArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const c =
      r.data ??
      r.items ??
      r.methods ??
      r.shippingMethods ??
      r.storeShippingMethods ??
      r.rates ??
      r.provinces ??
      r.list;
    if (Array.isArray(c)) return c;
  }
  return [];
}

function mapShippingMethod(raw: unknown): ShippingMethod | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    isActive: Boolean(r.isActive ?? true),
    isFreeMethod: Boolean(r.isFreeMethod),
  };
}

function mapStoreShipping(raw: unknown): StoreShippingMethod | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const description =
    asString(r.description) ||
    (r.description && typeof r.description === "object"
      ? asString((r.description as { value?: unknown }).value)
      : null) ||
    "";

  const phrase =
    asString(r.phrase) ||
    (r.phrase && typeof r.phrase === "object"
      ? asString((r.phrase as { value?: unknown }).value)
      : null);

  return {
    id,
    description,
    phrase,
    isActive: Boolean(r.isActive ?? true),
    minDays: asNumber(r.minDays) ?? 0,
    maxDays: asNumber(r.maxDays) ?? 0,
    defaultPrice: asNumber(r.defaultPrice) ?? 0,
    storeId: asString(r.storeId),
    shippingMethodId: asString(r.shippingMethodId),
    createdAt: asString(r.createdAt) ?? "",
  };
}

function mapRate(raw: unknown): ShippingRate | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;
  const province = (r.province ?? {}) as Record<string, unknown>;
  return {
    id,
    price: asNumber(r.price) ?? 0,
    deliveryMaxDays: asNumber(r.deliveryMaxDays) ?? 0,
    provinceId: asString(r.provinceId) || asString(province.id) || "",
    provinceName: asString(province.name) || "—",
    createdAt: asString(r.createdAt) ?? "",
  };
}

function mapProvince(raw: unknown): ProvinceOption | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  if (!id || !name) return null;
  return { id, name };
}

/** GET /shipping — روش‌های پایه سیستم */
export async function fetchShippingMethods(): Promise<ShippingMethod[]> {
  const { data } = await apiClient.get("/shipping");
  return asArray(data)
    .map(mapShippingMethod)
    .filter((x): x is ShippingMethod => x !== null);
}

/** GET /shipping/store */
export async function fetchStoreShippingMethods(): Promise<
  StoreShippingMethod[]
> {
  const { data } = await apiClient.get("/shipping/store");
  return asArray(data)
    .map(mapStoreShipping)
    .filter((x): x is StoreShippingMethod => x !== null);
}

export async function createStoreShipping(
  payload: CreateStoreShippingInput,
): Promise<void> {
  const body: Record<string, unknown> = {
    description: payload.description,
    isActive: payload.isActive ?? true,
    phrase: payload.phrase ?? null,
    minDays: payload.minDays ?? 0,
    maxDays: payload.maxDays ?? 0,
    defaultPrice: payload.defaultPrice ?? 0,
  };

  const methodId = payload.shippingMethodId?.trim();
  if (methodId) {
    body.shippingMethodId = methodId;
  }

  await apiClient.post("/shipping/store", body);
}

/** PUT /shipping/store/{id} */
export async function updateStoreShipping(
  id: string,
  payload: UpdateStoreShippingInput,
): Promise<void> {
  await apiClient.put(`/shipping/store/${id}`, payload);
}

/** DELETE /shipping/store/{id} */
export async function deleteStoreShipping(id: string): Promise<void> {
  await apiClient.delete(`/shipping/store/${id}`);
}

/** GET /shipping/store/{id} — نرخ‌های استانی */
export async function fetchShippingRates(
  storeShippingMethodId: string,
): Promise<ShippingRate[]> {
  const { data } = await apiClient.get(
    `/shipping/store/${storeShippingMethodId}`,
  );
  return asArray(data)
    .map(mapRate)
    .filter((x): x is ShippingRate => x !== null);
}

/** POST /shipping/rate */
export async function createShippingRate(
  payload: UpsertShippingRateInput,
): Promise<void> {
  await apiClient.post("/shipping/rate", payload);
}

/** PUT /shipping/rate/{id} */
export async function updateShippingRate(
  id: string,
  payload: UpsertShippingRateInput,
): Promise<void> {
  await apiClient.put(`/shipping/rate/${id}`, payload);
}

/** DELETE /shipping/rate/{id} */
export async function deleteShippingRate(id: string): Promise<void> {
  await apiClient.delete(`/shipping/rate/${id}`);
}

/** GET /province */
export async function fetchProvinces(): Promise<ProvinceOption[]> {
  const { data } = await apiClient.get("/province");
  return asArray(data)
    .map(mapProvince)
    .filter((x): x is ProvinceOption => x !== null);
}

function mapShippingOption(raw: unknown): ShippingOption | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const storeId =
    asString(r.storeId) ||
    asString((r.store as Record<string, unknown> | undefined)?.id);
  if (!id || !storeId) return null;

  const method = (r.shippingMethod ?? r.method ?? {}) as Record<
    string,
    unknown
  >;

  return {
    id,
    storeId,
    description: asString(r.description) ?? "",
    phrase: asString(r.phrase),
    methodName:
      asString(method.name) ?? asString(r.methodName) ?? asString(r.name),
    minDays: asNumber(r.minDays) ?? 0,
    maxDays: asNumber(r.maxDays) ?? 0,
    defaultPrice: asNumber(r.defaultPrice) ?? asNumber(r.price) ?? 0,
    isActive: Boolean(r.isActive ?? true),
  };
}

/**
 * GET /shipping/order/{provinceId}
 * گزینه‌های ارسال قابل استفاده برای سفارش در آن استان
 */
export async function fetchShippingForOrder(
  provinceId: string,
): Promise<ShippingOption[]> {
  if (!provinceId?.trim()) return [];
  const { data } = await apiClient.get(
    `/shipping/order/${encodeURIComponent(provinceId)}`,
  );
  return asArray(data)
    .map(mapShippingOption)
    .filter((x): x is ShippingOption => x !== null && x.isActive);
}
