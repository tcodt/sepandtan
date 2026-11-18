import { apiClient } from "@/lib/api/client";
import type { FoodAdmin, FoodFilters, FoodInput, FoodResponse } from "./types";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (v && typeof v === "object" && "value" in v) {
    return asString((v as { value: unknown }).value);
  }
  return null;
}

function num(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null || v === "") return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function mapItem(raw: unknown): FoodAdmin | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  if (!id || !name) return null;

  return {
    id,
    name,
    caloriesPer100g: num(r.caloriesPer100g, 0),
    proteinPer100g: num(r.proteinPer100g, 0),
    carbsPer100g: num(r.carbsPer100g, 0),
    fatPer100g: num(r.fatPer100g, 0),
    isActive:
      r.isActive === true || r.isActive === "true" || r.isActive == null,
    createdAt: asString(r.createdAt) || "",
    updatedAt: asString(r.updatedAt) || "",
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of ["food", "foods", "data", "items", "results"]) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

function toBody(input: FoodInput): Record<string, unknown> {
  return {
    name: input.name.trim(),
    caloriesPer100g: input.caloriesPer100g,
    proteinPer100g: input.proteinPer100g ?? 0,
    carbsPer100g: input.carbsPer100g ?? 0,
    fatPer100g: input.fatPer100g ?? 0,
    isActive: input.isActive ?? true,
  };
}

/** GET /admin/food */
export async function fetchAdminFoods(
  filters: FoodFilters = {},
): Promise<FoodResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;

  const { data } = await apiClient.get("/admin/food", {
    params: {
      page,
      limit,
      order: filters.order ?? "asc",
    },
  });

  const root = (data ?? {}) as Record<string, unknown>;
  let items = extractList(root)
    .map(mapItem)
    .filter((x): x is FoodAdmin => x !== null);

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter((f) => f.name.toLowerCase().includes(q));
  }

  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total, items.length);
  const totalPages =
    num(pag.totalPages, 0) || Math.max(1, Math.ceil(total / limit));
  const currentPage = num(pag.page, page) || page;

  return {
    data: items,
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      prevPage: currentPage > 1 ? currentPage - 1 : null,
    },
  };
}

/** POST /admin/food */
export async function createFood(input: FoodInput): Promise<void> {
  if (!input.name?.trim()) throw new Error("نام غذا الزامی است");
  if (input.caloriesPer100g == null || Number.isNaN(input.caloriesPer100g)) {
    throw new Error("کالری الزامی است");
  }
  await apiClient.post("/admin/food", toBody(input));
}

/** PUT /admin/food/{id} */
export async function updateFood(id: string, input: FoodInput): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  if (!input.name?.trim()) throw new Error("نام غذا الزامی است");
  await apiClient.put(`/admin/food/${encodeURIComponent(id)}`, toBody(input));
}

/** DELETE /admin/food/{id} */
export async function deleteFood(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/admin/food/${encodeURIComponent(id)}`);
}
