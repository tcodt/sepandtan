import { apiClient } from "@/lib/api/client";
import { asArray, asNumber, asString, mapPagination } from "../utils";
import type {
  Color,
  ColorAdmin,
  ColorsAdminFilters,
  ColorsAdminResponse,
  CreateColorInput,
  UpdateColorInput,
} from "../types";

function mapColor(raw: unknown): Color | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  const slug = asString(r.slug);
  const hexCode = asString(r.hexCode);
  if (!id || !name || !slug || !hexCode) return null;
  return { id, name, slug, hexCode };
}

function mapColorAdmin(raw: unknown): ColorAdmin | null {
  const base = mapColor(raw);
  if (!base) return null;
  const r = (raw ?? {}) as Record<string, unknown>;
  const count = (r._count ?? {}) as Record<string, unknown>;
  return {
    ...base,
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
    productVariantCount: asNumber(count.productVariants) ?? 0,
  };
}

/** GET /colors — Public */
export async function fetchColors(): Promise<Color[]> {
  const { data } = await apiClient.get("/colors");
  return asArray(data)
    .map(mapColor)
    .filter((c): c is Color => c !== null);
}

/** GET /colors/admin */
export async function fetchColorsAdmin(
  filters: ColorsAdminFilters = {},
): Promise<ColorsAdminResponse> {
  const { data } = await apiClient.get("/colors/admin", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      order: filters.order ?? "desc",
      search: filters.search || undefined,
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.colors ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    colors: list.map(mapColorAdmin).filter((c): c is ColorAdmin => c !== null),
  };
}

/** POST /colors */
export async function createColor(payload: CreateColorInput): Promise<void> {
  await apiClient.post("/colors", payload);
}

/** PUT /colors/{id} */
export async function updateColor(
  id: string,
  payload: UpdateColorInput,
): Promise<void> {
  await apiClient.put(`/colors/${id}`, payload);
}

/** DELETE /colors/{id} */
export async function deleteColor(id: string): Promise<void> {
  await apiClient.delete(`/colors/${id}`);
}
