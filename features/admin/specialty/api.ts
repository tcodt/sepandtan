import { apiClient } from "@/lib/api/client";
import type {
  SpecialtyAdmin,
  SpecialtyFilters,
  SpecialtyInput,
  SpecialtyResponse,
} from "./types";

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

function mapItem(raw: unknown): SpecialtyAdmin | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const slug = asString(r.slug);
  const title = asString(r.title);
  if (!id || !slug || !title) return null;
  return {
    id,
    slug,
    title,
    createdAt: asString(r.createdAt) || "",
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of ["specialty", "specialties", "data", "items", "results"]) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

/** GET /admin/specialty */
export async function fetchAdminSpecialties(
  filters: SpecialtyFilters = {},
): Promise<SpecialtyResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;

  const { data } = await apiClient.get("/admin/specialty", {
    params: {
      page,
      limit,
      order: filters.order ?? "asc",
    },
  });

  const root = (data ?? {}) as Record<string, unknown>;
  let items = extractList(root)
    .map(mapItem)
    .filter((x): x is SpecialtyAdmin => x !== null);

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (s) =>
        s.title.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q),
    );
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

/** POST /admin/specialty */
export async function createSpecialty(input: SpecialtyInput): Promise<void> {
  if (!input.title?.trim()) throw new Error("عنوان الزامی است");
  if (!input.slug?.trim()) throw new Error("slug الزامی است");
  await apiClient.post("/admin/specialty", {
    title: input.title.trim(),
    slug: input.slug.trim(),
  });
}

/** PUT /admin/specialty/{id} */
export async function updateSpecialty(
  id: string,
  input: SpecialtyInput,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  if (!input.title?.trim()) throw new Error("عنوان الزامی است");
  if (!input.slug?.trim()) throw new Error("slug الزامی است");
  await apiClient.put(`/admin/specialty/${encodeURIComponent(id)}`, {
    title: input.title.trim(),
    slug: input.slug.trim(),
  });
}

/** DELETE /admin/specialty/{id} */
export async function deleteSpecialty(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/admin/specialty/${encodeURIComponent(id)}`);
}
