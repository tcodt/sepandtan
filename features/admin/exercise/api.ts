import { apiClient } from "@/lib/api/client";
import type {
  ExerciseAdmin,
  ExerciseFilters,
  ExerciseInput,
  ExerciseLevel,
  ExerciseResponse,
} from "./types";

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (v && typeof v === "object" && "value" in v) {
    return asString((v as { value: unknown }).value);
  }
  return null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function asLevel(v: unknown): ExerciseLevel {
  const s = asString(v)?.toUpperCase();
  if (s === "INTERMEDIATE" || s === "ADVANCED" || s === "BEGINNER") return s;
  return "BEGINNER";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(asString).filter((x): x is string => Boolean(x));
}

function mapItem(raw: unknown): ExerciseAdmin | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const title = asString(r.title);
  const slug = asString(r.slug);
  if (!id || !title || !slug) return null;

  const muscles = (r.muscles ?? r.muscleGroups ?? r.muscle) as unknown;
  const muscleIdsFromRel = Array.isArray(muscles)
    ? muscles
        .map((m) => asString((m as Record<string, unknown>)?.id))
        .filter((x): x is string => Boolean(x))
    : [];

  const equipments = (r.equipments ?? r.equipment) as unknown;
  const equipmentIdsFromRel = Array.isArray(equipments)
    ? equipments
        .map((m) => asString((m as Record<string, unknown>)?.id))
        .filter((x): x is string => Boolean(x))
    : [];

  return {
    id,
    title,
    slug,
    description: asString(r.description),
    notic: asStringArray(r.notic),
    stepAction: asStringArray(r.stepAction),
    level: asLevel(r.level),
    isActive: r.isActive === true || r.isActive === "true",
    durationMin: num(r.durationMin),
    caloriesMin: num(r.caloriesMin),
    caloriesMax: num(r.caloriesMax),
    gif: asString(r.gif),
    video: asString(r.video),
    coverImg: asString(r.coverImg),
    categoryId: asString(r.categoryId),
    muscleIds: asStringArray(r.muscleIds).length
      ? asStringArray(r.muscleIds)
      : muscleIdsFromRel,
    equipmentIds: asStringArray(r.equipmentIds).length
      ? asStringArray(r.equipmentIds)
      : equipmentIdsFromRel,
    createdAt: asString(r.createdAt) || "",
    updatedAt: asString(r.updatedAt) || "",
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of ["exercise", "exercises", "data", "items", "results"]) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

function toBody(input: ExerciseInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: input.title.trim(),
    slug: input.slug.trim(),
    isActive: input.isActive ?? true,
    level: input.level ?? "BEGINNER",
    notic: input.notic ?? [],
    stepAction: input.stepAction ?? [],
  };

  if (input.description != null) body.description = input.description;
  if (input.durationMin != null) body.durationMin = input.durationMin;
  if (input.caloriesMin != null) body.caloriesMin = input.caloriesMin;
  if (input.caloriesMax != null) body.caloriesMax = input.caloriesMax;
  if (input.gif) body.gif = input.gif;
  if (input.video) body.video = input.video;
  if (input.coverImg) body.coverImg = input.coverImg;
  if (input.categoryId) body.categoryId = input.categoryId;
  if (input.muscleIds?.length) body.muscleIds = input.muscleIds;
  if (input.equipmentIds?.length) body.equipmentIds = input.equipmentIds;

  return body;
}

/** GET /admin/exercise */
export async function fetchAdminExercises(
  filters: ExerciseFilters = {},
): Promise<ExerciseResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;

  const { data } = await apiClient.get("/admin/exercise", {
    params: {
      page,
      limit,
      order: filters.order ?? "desc",
    },
  });

  const root = (data ?? {}) as Record<string, unknown>;
  let items = extractList(root)
    .map(mapItem)
    .filter((x): x is ExerciseAdmin => x !== null);

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (e) =>
        e.title.toLowerCase().includes(q) || e.slug.toLowerCase().includes(q),
    );
  }
  if (filters.level && filters.level !== "ALL") {
    items = items.filter((e) => e.level === filters.level);
  }
  if (filters.isActive !== undefined && filters.isActive !== "ALL") {
    items = items.filter((e) => e.isActive === filters.isActive);
  }

  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total) ?? items.length;
  const totalPages =
    num(pag.totalPages) || Math.max(1, Math.ceil(total / limit));
  const currentPage = num(pag.page) || page;

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

/** POST /admin/exercise */
export async function createExercise(input: ExerciseInput): Promise<void> {
  if (!input.title?.trim()) throw new Error("عنوان الزامی است");
  if (!input.slug?.trim()) throw new Error("slug الزامی است");
  await apiClient.post("/admin/exercise", toBody(input));
}

/** PUT /admin/exercise/{id} */
export async function updateExercise(
  id: string,
  input: ExerciseInput,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  if (!input.title?.trim()) throw new Error("عنوان الزامی است");
  if (!input.slug?.trim()) throw new Error("slug الزامی است");
  await apiClient.put(
    `/admin/exercise/${encodeURIComponent(id)}`,
    toBody(input),
  );
}

/** DELETE /admin/exercise/{id} */
export async function deleteExercise(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/admin/exercise/${encodeURIComponent(id)}`);
}
