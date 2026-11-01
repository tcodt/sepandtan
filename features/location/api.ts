import { apiClient } from "@/lib/api/client";
import type { City, Province } from "./types";

function asArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const list = r.data ?? r.items ?? r.provinces ?? r.cities ?? r.results;
    if (Array.isArray(list)) return list;
  }
  return [];
}

function mapProvince(raw: unknown): Province | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : null;
  const name = typeof r.name === "string" ? r.name : null;
  if (!id || !name) return null;
  return {
    id,
    name,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : undefined,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : undefined,
  };
}

function mapCity(raw: unknown): City | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : null;
  const name = typeof r.name === "string" ? r.name : null;
  const provinceId =
    typeof r.provinceId === "string"
      ? r.provinceId
      : typeof (r.province as { id?: string } | undefined)?.id === "string"
        ? (r.province as { id: string }).id
        : null;
  if (!id || !name || !provinceId) return null;
  return {
    id,
    name,
    provinceId,
    createdAt: typeof r.createdAt === "string" ? r.createdAt : undefined,
    updatedAt: typeof r.updatedAt === "string" ? r.updatedAt : undefined,
  };
}

/** GET /province — Public */
export async function fetchProvinces(): Promise<Province[]> {
  const { data } = await apiClient.get("/province");
  return asArray(data)
    .map(mapProvince)
    .filter((p): p is Province => p !== null);
}

/** GET /province/city?provinceId= — Public */
export async function fetchCities(provinceId?: string): Promise<City[]> {
  const { data } = await apiClient.get("/province/city", {
    params: provinceId ? { provinceId } : undefined,
  });
  return asArray(data)
    .map(mapCity)
    .filter((c): c is City => c !== null);
}
