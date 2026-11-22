import { apiClient } from "@/lib/api/client";
import type {
  CityAdmin,
  CityInput,
  CityUpdateInput,
  ProvinceAdmin,
  ProvinceInput,
} from "./types";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

function mapProvince(raw: unknown): ProvinceAdmin | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    createdAt: asString(r.createdAt) || "",
    updatedAt: asString(r.updatedAt) || "",
  };
}

function mapCity(raw: unknown): CityAdmin | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  const provinceId = asString(r.provinceId) || "";
  if (!id || !name) return null;
  return {
    id,
    name,
    provinceId,
    createdAt: asString(r.createdAt) || "",
    updatedAt: asString(r.updatedAt) || "",
  };
}

function extractList(root: unknown, keys: string[]): unknown[] {
  if (Array.isArray(root)) return root;
  const r = (root ?? {}) as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(r[key])) return r[key] as unknown[];
  }
  if (Array.isArray(r.data)) return r.data as unknown[];
  return [];
}

/** GET /province — برای ادمین هم همین لیست عمومی کافی است */
export async function fetchAdminProvinces(): Promise<ProvinceAdmin[]> {
  const { data } = await apiClient.get("/province");
  return extractList(data, ["province", "provinces", "data"])
    .map(mapProvince)
    .filter((x): x is ProvinceAdmin => x !== null);
}

/** POST /province — CreateProvinceDto */
export async function createProvince(input: ProvinceInput): Promise<void> {
  if (!input.name?.trim()) throw new Error("نام استان الزامی است");
  await apiClient.post("/province", { name: input.name.trim() });
}

/** PUT /province/{id} */
export async function updateProvince(
  id: string,
  input: ProvinceInput,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  if (!input.name?.trim()) throw new Error("نام استان الزامی است");
  await apiClient.put(`/province/${encodeURIComponent(id)}`, {
    name: input.name.trim(),
  });
}

/** DELETE /province/{id} */
export async function deleteProvince(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/province/${encodeURIComponent(id)}`);
}

/** GET /province/city?provinceId= */
export async function fetchAdminCities(
  provinceId?: string,
): Promise<CityAdmin[]> {
  const { data } = await apiClient.get("/province/city", {
    params: provinceId ? { provinceId } : undefined,
  });
  return extractList(data, ["city", "cities", "data"])
    .map(mapCity)
    .filter((x): x is CityAdmin => x !== null);
}

/** POST /province/city — CreateCityDto */
export async function createCity(input: CityInput): Promise<void> {
  if (!input.name?.trim()) throw new Error("نام شهر الزامی است");
  if (!input.provinceId?.trim()) throw new Error("استان الزامی است");
  await apiClient.post("/province/city", {
    name: input.name.trim(),
    provinceId: input.provinceId.trim(),
  });
}

/** PUT /province/city/{id} — UpdateCityDto */
export async function updateCity(
  id: string,
  input: CityUpdateInput,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  if (!input.name?.trim()) throw new Error("نام شهر الزامی است");
  await apiClient.put(`/province/city/${encodeURIComponent(id)}`, {
    name: input.name.trim(),
  });
}

/** DELETE /province/city/{id} */
export async function deleteCity(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/province/city/${encodeURIComponent(id)}`);
}
