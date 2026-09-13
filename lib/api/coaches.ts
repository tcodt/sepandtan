import type { Coach, CollaborationRequest } from "@/lib/types/coach";
import { db } from "./db";
import { createId, delay } from "./client";

export async function getCoaches(): Promise<Coach[]> {
  await delay();
  return db.coaches
    .filter((c) => c.isActive)
    .map((c) => ({ ...c, specialties: [...c.specialties] }));
}

export async function getCoachById(id: string): Promise<Coach> {
  await delay();
  const coach = db.coaches.find((c) => c.id === id);
  if (!coach) throw new Error(`مربی پیدا نشد: ${id}`);
  return { ...coach, specialties: [...coach.specialties] };
}

export async function createCollaborationRequest(
  payload: Omit<CollaborationRequest, "id" | "createdAt" | "status"> & {
    status?: CollaborationRequest["status"];
  },
): Promise<CollaborationRequest> {
  await delay();

  const request: CollaborationRequest = {
    id: createId("req"),
    userId: payload.userId,
    coachId: payload.coachId,
    goal: payload.goal,
    message: payload.message,
    status: payload.status ?? "pending",
    createdAt: new Date().toISOString(),
  };

  db.collaborationRequests.push(request);
  return { ...request };
}

export async function getMyCollaborationRequests(
  userId: string,
): Promise<CollaborationRequest[]> {
  await delay();
  return db.collaborationRequests
    .filter((r) => r.userId === userId)
    .map((r) => ({ ...r }));
}

export async function cancelCollaborationRequest(
  id: string,
): Promise<CollaborationRequest> {
  await delay();
  const index = db.collaborationRequests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error(`درخواست پیدا نشد: ${id}`);

  const updated: CollaborationRequest = {
    ...db.collaborationRequests[index],
    status: "cancelled",
  };
  db.collaborationRequests[index] = updated;
  return { ...updated };
}

export async function deleteCollaborationRequest(id: string): Promise<void> {
  await delay();
  const index = db.collaborationRequests.findIndex((r) => r.id === id);
  if (index === -1) throw new Error(`درخواست پیدا نشد: ${id}`);
  db.collaborationRequests.splice(index, 1);
}
