import { apiClient } from "@/lib/api/client";
import type {
  TrainingGoalAdmin,
  TrainingGoalInput,
  TrainingGoalsFilters,
  TrainingGoalsResponse,
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

function mapGoal(raw: unknown): TrainingGoalAdmin | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const title = asString(r.title);
  if (!id || !title) return null;

  return {
    id,
    title,
    logo: asString(r.logo),
    description: asString(r.description),
    sortOrder: num(r.sortOrder, 0),
  };
}

function extractList(root: Record<string, unknown>): unknown[] {
  for (const key of [
    "trainingGoal",
    "trainingGoals",
    "data",
    "items",
    "results",
  ]) {
    const v = root[key];
    if (Array.isArray(v)) return v;
  }
  return Array.isArray(root) ? (root as unknown[]) : [];
}

function toBody(input: TrainingGoalInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    title: input.title.trim(),
  };
  if (input.logo != null && String(input.logo).trim()) {
    body.logo = String(input.logo).trim();
  }
  if (input.description != null) {
    body.description = String(input.description).trim();
  }
  if (input.sortOrder != null && Number.isFinite(input.sortOrder)) {
    body.sortOrder = input.sortOrder;
  }
  return body;
}

/** GET /admin/training-goal */
export async function fetchAdminTrainingGoals(
  filters: TrainingGoalsFilters = {},
): Promise<TrainingGoalsResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;

  const { data } = await apiClient.get("/admin/training-goal", {
    params: {
      page,
      limit,
      order: filters.order ?? "asc",
    },
  });

  const root = (data ?? {}) as Record<string, unknown>;
  let items = extractList(root)
    .map(mapGoal)
    .filter((x): x is TrainingGoalAdmin => x !== null);

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    items = items.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        (g.description ?? "").toLowerCase().includes(q),
    );
  }

  items = [...items].sort((a, b) => a.sortOrder - b.sortOrder);

  const pag = (root.pagination ?? root.meta ?? {}) as Record<string, unknown>;
  const total = num(pag.total, items.length);
  const totalPages =
    num(pag.totalPages, 0) || Math.max(1, Math.ceil(total / limit));
  const currentPage = num(pag.page, page) || page;

  const nextRaw = num(pag.nextPage, -1);
  const prevRaw = num(pag.prevPage, -1);

  return {
    data: items,
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
      nextPage:
        nextRaw >= 0
          ? nextRaw || null
          : currentPage < totalPages
            ? currentPage + 1
            : null,
      prevPage:
        prevRaw >= 0
          ? prevRaw || null
          : currentPage > 1
            ? currentPage - 1
            : null,
    },
  };
}

/** GET /catalog/training-goal — onboarding / selectors */
export async function fetchTrainingGoalsCatalog(): Promise<
  TrainingGoalAdmin[]
> {
  const { data } = await apiClient.get("/catalog/training-goal");
  const root = (data ?? {}) as Record<string, unknown>;
  return extractList(root)
    .map(mapGoal)
    .filter((x): x is TrainingGoalAdmin => x !== null)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** POST /admin/training-goal */
export async function createTrainingGoal(
  input: TrainingGoalInput,
): Promise<void> {
  if (!input.title?.trim()) throw new Error("عنوان الزامی است");
  await apiClient.post("/admin/training-goal", toBody(input));
}

/** PUT /admin/training-goal/{id} */
export async function updateTrainingGoal(
  id: string,
  input: TrainingGoalInput,
): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  if (!input.title?.trim()) throw new Error("عنوان الزامی است");
  await apiClient.put(
    `/admin/training-goal/${encodeURIComponent(id)}`,
    toBody(input),
  );
}

/** DELETE /admin/training-goal/{id} */
export async function deleteTrainingGoal(id: string): Promise<void> {
  if (!id?.trim()) throw new Error("شناسه نامعتبر است");
  await apiClient.delete(`/admin/training-goal/${encodeURIComponent(id)}`);
}
