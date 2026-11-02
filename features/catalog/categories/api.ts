import { apiClient } from "@/lib/api/client";
import { asArray, asNumber, asString, mapPagination } from "../utils";
import type {
  CategoriesAdminFilters,
  CategoriesAdminResponse,
  CategoryAdmin,
  CategorySelectorItem,
  CategoryTree,
  CreateCategoryInput,
  UpdateCategoryInput,
} from "../types";

function mapCategoryTree(raw: unknown): CategoryTree | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  const slug = asString(r.slug);
  if (!id || !name || !slug) return null;

  const childrenRaw = Array.isArray(r.children) ? r.children : [];
  return {
    id,
    name,
    slug,
    icon: asString(r.icon),
    image: asString(r.image),
    parentId: asString(r.parentId),
    sortOrder: asNumber(r.sortOrder) ?? 0,
    children: childrenRaw
      .map(mapCategoryTree)
      .filter((c): c is CategoryTree => c !== null),
  };
}

function mapSelector(raw: unknown): CategorySelectorItem | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  const slug = asString(r.slug);
  if (!id || !name || !slug) return null;
  return { id, name, slug };
}

function mapCategoryAdmin(raw: unknown): CategoryAdmin | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const name = asString(r.name);
  const slug = asString(r.slug);
  if (!id || !name || !slug) return null;

  const count = (r._count ?? {}) as Record<string, unknown>;
  const childrenRaw = Array.isArray(r.children) ? r.children : [];
  const ancestors = Array.isArray(r.ancestorIds)
    ? r.ancestorIds.map((x) => asString(x)).filter(Boolean)
    : [];

  return {
    id,
    name,
    slug,
    parentId: asString(r.parentId),
    icon: asString(r.icon),
    image: asString(r.image),
    ancestorIds: ancestors as string[],
    sortOrder: asNumber(r.sortOrder) ?? 0,
    isActive: r.isActive !== false,
    metaTitle: asString(r.metaTitle),
    metaDescription: asString(r.metaDescription),
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asString(r.updatedAt) ?? "",
    children: childrenRaw
      .map(mapCategoryTree)
      .filter((c): c is CategoryTree => c !== null),
    productCount: asNumber(count.products) ?? 0,
  };
}

/** GET /categories — Public tree */
export async function fetchCategoryTree(): Promise<CategoryTree[]> {
  const { data } = await apiClient.get("/categories");
  return asArray(data)
    .map(mapCategoryTree)
    .filter((c): c is CategoryTree => c !== null);
}

/**
 * GET /categories/selector
 * allCategory=true → فقط برگ‌ها (پیش‌فرض swagger)
 * allCategory=false → همه دسته‌ها برای انتخابگر
 */
export async function fetchCategorySelector(
  allCategory = true,
): Promise<CategorySelectorItem[]> {
  const { data } = await apiClient.get("/categories/selector", {
    params: { allCategory },
  });
  return asArray(data)
    .map(mapSelector)
    .filter((c): c is CategorySelectorItem => c !== null);
}

/** GET /categories/{slug} */
export async function fetchCategoryBySlug(slug: string): Promise<unknown> {
  const { data } = await apiClient.get(
    `/categories/${encodeURIComponent(slug)}`,
  );
  return data;
}

/** GET /categories/admin */
export async function fetchCategoriesAdmin(
  filters: CategoriesAdminFilters = {},
): Promise<CategoriesAdminResponse> {
  const { data } = await apiClient.get("/categories/admin", {
    params: {
      page: filters.page ?? 1,
      limit: filters.limit ?? 20,
      order: filters.order ?? "desc",
    },
  });
  const r = (data ?? {}) as Record<string, unknown>;
  const list = asArray(r.categories ?? r.data ?? data);
  return {
    pagination: mapPagination(r.pagination ?? r.meta),
    categories: list
      .map(mapCategoryAdmin)
      .filter((c): c is CategoryAdmin => c !== null),
  };
}

/** POST /categories */
export async function createCategory(
  payload: CreateCategoryInput,
): Promise<void> {
  await apiClient.post("/categories", payload);
}

/** PUT /categories/{id} */
export async function updateCategory(
  id: string,
  payload: UpdateCategoryInput,
): Promise<void> {
  await apiClient.put(`/categories/${id}`, payload);
}

/** DELETE /categories/{id} */
export async function deleteCategory(id: string): Promise<void> {
  await apiClient.delete(`/categories/${id}`);
}
