import { apiClient } from "@/lib/api/client";
import { asArray, asString } from "@/features/catalog/utils";
import type {
  CreatePlanRequestInput,
  PlanRequest,
  PlanRequestStatus,
  RejectPlanRequestInput,
} from "./types";

function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return asString(value);
}

function extractList(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  const root = (data ?? {}) as Record<string, unknown>;
  for (const key of ["requests", "planRequests", "data", "items", "results"]) {
    if (Array.isArray(root[key])) return root[key] as unknown[];
  }
  return asArray(data);
}

export function mapPlanRequest(raw: unknown): PlanRequest | null {
  const r = (raw ?? {}) as Record<string, unknown>;
  const id = asString(r.id);
  const coachId =
    asString(r.coachId) ??
    asString((r.coach as Record<string, unknown> | undefined)?.id);
  if (!id || !coachId) return null;

  const imagesRaw = Array.isArray(r.images) ? r.images : [];
  const images = imagesRaw
    .map((x) => asString(x))
    .filter((x): x is string => Boolean(x));

  const coach = r.coach as Record<string, unknown> | undefined;

  return {
    id,
    coachId,
    userId:
      asNullableString(r.userId) ??
      asNullableString((r.user as Record<string, unknown> | undefined)?.id),
    status: (asString(r.status) ?? "PENDING") as PlanRequestStatus,
    note: asNullableString(r.note) ?? asNullableString(r.message),
    rejectionReason: asNullableString(r.rejectionReason),
    workoutTemplateId: asNullableString(r.workoutTemplateId),
    dietTemplateId: asNullableString(r.dietTemplateId),
    images,
    createdAt: asString(r.createdAt) ?? "",
    updatedAt: asNullableString(r.updatedAt),
    coachName:
      asNullableString(coach?.title) ?? asNullableString(coach?.name) ?? null,
    raw: r,
  };
}

/** POST /plan-request */
export async function createPlanRequest(
  input: CreatePlanRequestInput,
): Promise<PlanRequest> {
  const body: Record<string, unknown> = { coachId: input.coachId };
  if (input.workoutTemplateId) body.workoutTemplateId = input.workoutTemplateId;
  if (input.dietTemplateId) body.dietTemplateId = input.dietTemplateId;
  if (input.images?.length) body.images = input.images;
  if (input.note) body.note = input.note;

  const { data } = await apiClient.post("/plan-request", body);
  const mapped = mapPlanRequest(data);
  if (!mapped) throw new Error("پاسخ ثبت درخواست نامعتبر است");
  return mapped;
}

/** GET /plan-request/my */
export async function fetchMyPlanRequests(): Promise<PlanRequest[]> {
  const { data } = await apiClient.get("/plan-request/my");
  return extractList(data)
    .map(mapPlanRequest)
    .filter((r): r is PlanRequest => r !== null);
}

/** PATCH /plan-request/{id}/cancel */
export async function cancelPlanRequest(id: string): Promise<PlanRequest> {
  const { data } = await apiClient.patch(
    `/plan-request/${encodeURIComponent(id)}/cancel`,
  );
  const mapped = mapPlanRequest(data);
  if (!mapped) throw new Error("پاسخ لغو درخواست نامعتبر است");
  return mapped;
}

/** DELETE /plan-request/my/{requestId} */
export async function deleteMyPlanRequest(requestId: string): Promise<void> {
  await apiClient.delete(`/plan-request/my/${encodeURIComponent(requestId)}`);
}

/** GET /plan-request/coach */
export async function fetchCoachPlanRequests(): Promise<PlanRequest[]> {
  const { data } = await apiClient.get("/plan-request/coach");
  return extractList(data)
    .map(mapPlanRequest)
    .filter((r): r is PlanRequest => r !== null);
}

/** GET /plan-request/coach/{id} */
export async function fetchCoachPlanRequestById(
  id: string,
): Promise<PlanRequest> {
  const { data } = await apiClient.get(
    `/plan-request/coach/${encodeURIComponent(id)}`,
  );
  const mapped = mapPlanRequest(data);
  if (!mapped) throw new Error("درخواست پیدا نشد");
  return mapped;
}

/** PATCH /plan-request/coach/{id}/accept */
export async function acceptPlanRequest(id: string): Promise<PlanRequest> {
  const { data } = await apiClient.patch(
    `/plan-request/coach/${encodeURIComponent(id)}/accept`,
  );
  const mapped = mapPlanRequest(data);
  if (!mapped) throw new Error("پاسخ تأیید درخواست نامعتبر است");
  return mapped;
}

/** PATCH /plan-request/coach/{id}/reject */
export async function rejectPlanRequest(
  id: string,
  input: RejectPlanRequestInput = {},
): Promise<PlanRequest> {
  const { data } = await apiClient.patch(
    `/plan-request/coach/${encodeURIComponent(id)}/reject`,
    input.rejectionReason ? { rejectionReason: input.rejectionReason } : {},
  );
  const mapped = mapPlanRequest(data);
  if (!mapped) throw new Error("پاسخ رد درخواست نامعتبر است");
  return mapped;
}
