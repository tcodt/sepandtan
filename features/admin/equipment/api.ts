import { apiClient } from "@/lib/api/client";
import type {
  EquipmentAdmin,
  EquipmentFilters,
  EquipmentInput,
  EquipmentResponse,
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

function mapItem(raw: unknown): EquipmentAdmin | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const slug = asString(r.slug);
  const title = asString(r.title);
  if (!id || !slug || !title) return null;
  return {
    id,
    slug,
    title,
    image: asString(r.image),
    description: asString(r.description),
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of ["equipment", "equipments", "data", "items", "results"]) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

function toBody(input: EquipmentInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: input.title.trim(),
    slug: input.slug.trim(),
  };
  if (input.image != null && String(input.image).trim()) {
    body.image = String(input.image).trim();
  }
  if (input.description != null) {
    body.description = String(input.description).trim();
  }
  return body;
}

/** GET /admin/equipment */
export async function fetchAdminEquipment(
  filters: EquipmentFilters = {},
): Promise<EquipmentResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;

  const { data } = await apiClient.get("/admin/equipment", {
    params: {
      page,
      limit,
      order: filters.order ?? "asc",
    },
  });

  const root = (data ?? {}) as Record<string, unknown>;
  let items = extractList(root)
    .map(mapItem)
    .filter((x): x is EquipmentAdmin => x !== null);

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.description ?? "").toLowerCase().includes(q),
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

/** POST /admin/equipment */
export async function createEquipment(input: EquipmentInput): Promise<void> {
  if (!input.title?.trim()) throw new Error("عنوان الزامی است");
  if (!input.slug?.trim()) throw new Error("slug الزامی است");
  await apiClient.post("/admin/equipment", toBody(input));
}

/** PUT /admin/equipment/{id} */
export async function updateEquipment(
  id: string,
  input: EquipmentInput,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  if (!input.title?.trim()) throw new Error("عنوان الزامی است");
  if (!input.slug?.trim()) throw new Error("slug الزامی است");
  await apiClient.put(
    `/admin/equipment/${encodeURIComponent(id)}`,
    toBody(input),
  );
}

/** DELETE /admin/equipment/{id} */
export async function deleteEquipment(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/admin/equipment/${encodeURIComponent(id)}`);
}
