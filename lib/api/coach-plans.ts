/**
 * accept/reject/inbox → real plan-request API
 * plan drafts → still local db until user-plan/coach snapshots
 */
import type { CollaborationRequest } from "@/lib/types/coach";
import type { ClientRelation } from "@/lib/types/client-relation";
import type { Plan, PlanStatus } from "@/lib/types/plan";
import { createId, delay } from "./client";
import { db } from "./db";
import {
  acceptPlanRequest,
  fetchCoachPlanRequests,
  rejectPlanRequest,
} from "@/features/plan-request/api";
import type { PlanRequest } from "@/features/plan-request/types";

function mapStatus(
  status: PlanRequest["status"],
): CollaborationRequest["status"] {
  switch (status) {
    case "ACCEPTED":
    case "PAID":
    case "DELIVERED":
      return "accepted";
    case "REJECTED":
      return "rejected";
    case "CANCELLED":
      return "cancelled";
    case "PENDING":
    default:
      return "pending";
  }
}

export function toCollaborationRequest(req: PlanRequest): CollaborationRequest {
  return {
    id: req.id,
    userId: req.userId ?? "",
    coachId: req.coachId,
    goal: "",
    message: req.note ?? "",
    status: mapStatus(req.status),
    createdAt: req.createdAt,
    respondedAt: req.updatedAt,
    rejectionReason: req.rejectionReason,
  };
}

/** GET /plan-request/coach */
export async function getCoachCollaborationRequests(): Promise<
  CollaborationRequest[]
> {
  const list = await fetchCoachPlanRequests();
  return list.map(toCollaborationRequest);
}

/** PATCH /plan-request/coach/{id}/accept */
export async function acceptCollaborationRequest(
  requestId: string,
): Promise<ClientRelation> {
  const updated = await acceptPlanRequest(requestId);
  const now = new Date().toISOString();

  return {
    id: createId("cr"),
    coachId: updated.coachId,
    clientId: updated.userId ?? "",
    status: "active",
    collaborationRequestId: updated.id,
    startedAt: now,
    endedAt: null,
    createdAt: now,
  };
}

/** PATCH /plan-request/coach/{id}/reject */
export async function rejectCollaborationRequest(
  requestId: string,
  reason?: string,
): Promise<void> {
  await rejectPlanRequest(requestId, {
    rejectionReason: reason,
  });
}

/** Derived from accepted plan-requests until a client-relation API exists */
export async function getClientRelationsForCoach(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _coachId: string,
): Promise<ClientRelation[]> {
  const list = await fetchCoachPlanRequests();
  const now = new Date().toISOString();

  return list
    .filter((r) => ["ACCEPTED", "PAID", "DELIVERED"].includes(r.status))
    .map((r) => ({
      id: `cr-${r.id}`,
      coachId: r.coachId,
      clientId: r.userId ?? "",
      status: "active" as const,
      collaborationRequestId: r.id,
      startedAt: r.updatedAt ?? r.createdAt ?? now,
      endedAt: null,
      createdAt: r.createdAt || now,
    }));
}

// ─── Still FAKE: plan builder / drafts ───────────────────

export async function createCoachPlanDraft(
  coachId: string,
  data: Partial<Plan>,
): Promise<Plan> {
  await delay();
  const now = new Date().toISOString();
  const durationWeeks = data.durationWeeks ?? 4;

  const plan: Plan = {
    id: createId("plan"),
    userId: null,
    goal: data.goal ?? "general_fitness",
    equipment: data.equipment ?? "gym",
    level: data.level ?? "intermediate",
    title: data.title ?? "برنامه جدید مربی",
    description: data.description ?? "",
    startDate: null,
    durationDays: durationWeeks * 7,
    durationWeeks: durationWeeks as 4 | 6 | 8,
    days: data.days ?? [],
    status: "draft",
    source: "coach",
    coachId,
    createdAt: now,
  };

  db.plans.push(plan);
  return { ...plan };
}

export async function getCoachPlans(coachId: string): Promise<Plan[]> {
  await delay();
  return db.plans
    .filter((p) => p.coachId === coachId && p.source === "coach")
    .map((p) => ({ ...p }));
}

export async function getCoachPlanById(id: string): Promise<Plan | null> {
  await delay();
  const plan = db.plans.find((p) => p.id === id);
  return plan ? { ...plan } : null;
}

export async function updateCoachPlan(
  id: string,
  data: Partial<Plan>,
): Promise<Plan> {
  await delay();
  const idx = db.plans.findIndex((p) => p.id === id);
  if (idx < 0) throw new Error(`برنامه پیدا نشد: ${id}`);
  const updated: Plan = {
    ...db.plans[idx],
    ...data,
  };
  db.plans[idx] = updated;
  return { ...updated };
}

export async function publishCoachPlan(id: string): Promise<Plan> {
  return updateCoachPlan(id, {
    status: "published" as PlanStatus,
    publishedAt: new Date().toISOString(),
  });
}

export async function assignPlanToClient(
  planId: string,
  clientId: string,
): Promise<Plan> {
  return updateCoachPlan(planId, {
    userId: clientId,
    status: "active" as PlanStatus,
    startDate: new Date().toISOString().slice(0, 10),
    assignedAt: new Date().toISOString(),
  });
}
