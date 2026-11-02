import { apiClient } from "@/lib/api/client";
import { asArray, asNumber, asString, mapPagination } from "../utils";
import type {
  Brand,
  BrandAdmin,
  BrandInput,
  BrandsAdminFilters,
  BrandsAdminResponse,
} from "../types";

function mapBrand(raw: unknown): Brand | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  const slug = asString(r.slug);
  if (!id || !name || !slug) return null;
  return {
    id,
    name,
    slug,
    logo: asString(r.logo),
  };
}

function mapBrandAdmin(raw: unknown): BrandAdmin | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const base = mapBrand(raw);
  if (!base) return null;
  const count = (r._count ?? {}) as Record<string, unknown>;
  return {
    ...base,
    description: asString(r.description),
    sortOrder: asNumber(r.sortOrder) ?? 0,
    productCount: asNumber(count.products) ?? 0,
  };
}

/** GET /brand — Public selector */
export async function fetchBrands(): Promise<Brand[]> {
  const { data } = await apiClient.get("/brand");
  return asArray(data)
    .map(mapBrand)
    .filter((b): b is Brand => b !== null);
}

/** GET /brand/admin */
export async function fetchBrandsAdmin(
  filters: BrandsAdminFilters = {},
): Promise<BrandsAdminResponse> {
  const { data } = await apiClient.get("/brand/admin", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      order: filters.order ?? "desc",
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.brands ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    brands: list.map(mapBrandAdmin).filter((b): b is BrandAdmin => b !== null),
  };
}

/** POST /brand */
export async function createBrand(payload: BrandInput): Promise<void> {
  await apiClient.post("/brand", payload);
}

/** PUT /brand/{id} */
export async function updateBrand(
  id: string,
  payload: BrandInput,
): Promise<void> {
  await apiClient.put(`/brand/${id}`, payload);
}

/** DELETE /brand/{id} */
export async function deleteBrand(id: string): Promise<void> {
  await apiClient.delete(`/brand/${id}`);
}
