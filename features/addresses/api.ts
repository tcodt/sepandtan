import { apiClient } from "@/lib/api/client";
import type { Address, CreateAddressInput, UpdateAddressInput } from "./types";

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number") return String(value);
  return null;
}

function mapAddress(raw: unknown): Address | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  if (!id) return null;

  const province = (r.province ?? {}) as Record<string, unknown>;
  const city = (r.city ?? {}) as Record<string, unknown>;

  const fullName = asString(r.fullName) || asString(r.name) || "";
  const phone = asString(r.phone) || "";
  const provinceId = asString(r.provinceId) || asString(province.id) || "";
  const cityId = asString(r.cityId) || asString(city.id) || "";
  const addressLine = asString(r.address) || asString(r.fullAddress) || "";

  return {
    id,
    title: asString(r.title),
    fullName,
    phone,
    provinceId,
    cityId,
    address: addressLine,
    postalCode: asString(r.postalCode),
    isDefault: Boolean(r.isDefault),
    provinceName: asString(province.name) || asString(r.provinceName),
    cityName: asString(city.name) || asString(r.cityName),
    createdAt: asString(r.createdAt) ?? undefined,
    updatedAt: asString(r.updatedAt) ?? undefined,
  };
}

function asAddressList(raw: unknown): Address[] {
  let list: unknown[] = [];
  if (Array.isArray(raw)) {
    list = raw;
  } else if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const candidate = r.addresses ?? r.data ?? r.items ?? r.results ?? [];
    if (Array.isArray(candidate)) list = candidate;
  }
  return list.map(mapAddress).filter((a): a is Address => a !== null);
}

/** GET /addresse */
export async function fetchAddresses(): Promise<Address[]> {
  const { data } = await apiClient.get("/addresse");
  return asAddressList(data);
}

/** GET /addresse/default */
export async function fetchDefaultAddress(): Promise<Address | null> {
  try {
    const { data } = await apiClient.get("/addresse/default");
    return mapAddress(data);
  } catch {
    return null;
  }
}

/** GET /addresse/{id} */
export async function fetchAddressById(id: string): Promise<Address> {
  const { data } = await apiClient.get(`/addresse/${id}`);
  const mapped = mapAddress(data);
  if (!mapped) throw new Error("آدرس یافت نشد");
  return mapped;
}

/** POST /addresse */
export async function createAddress(
  payload: CreateAddressInput,
): Promise<Address> {
  const { data } = await apiClient.post("/addresse", payload);
  const mapped = mapAddress(data);
  if (!mapped) {
    // بعضی بک‌اندها فقط success برمی‌گردانند
    return {
      id: String((data as { id?: string })?.id ?? crypto.randomUUID()),
      ...payload,
      isDefault: payload.isDefault ?? false,
    };
  }
  return mapped;
}

/** PUT /addresse/{id} */
export async function updateAddress(
  id: string,
  payload: UpdateAddressInput,
): Promise<Address> {
  const { data } = await apiClient.put(`/addresse/${id}`, payload);
  const mapped = mapAddress(data);
  if (!mapped) {
    return {
      id,
      fullName: payload.fullName ?? "",
      phone: payload.phone ?? "",
      provinceId: payload.provinceId ?? "",
      cityId: payload.cityId ?? "",
      address: payload.address ?? "",
      title: payload.title,
      postalCode: payload.postalCode,
      isDefault: payload.isDefault ?? false,
    };
  }
  return mapped;
}

/** DELETE /addresse/{id} */
export async function deleteAddress(id: string): Promise<void> {
  await apiClient.delete(`/addresse/${id}`);
}

/** PUT /addresse/{id}/set-default */
export async function setDefaultAddress(id: string): Promise<void> {
  await apiClient.put(`/addresse/${id}/set-default`);
}
