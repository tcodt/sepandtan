import { api } from "./client";
import type { Coach, CollaborationRequest } from "@/lib/types/coach";

export async function getCoaches(): Promise<Coach[]> {
  return api.get<Coach[]>("/coaches?isActive=true");
}

export async function getCoachById(id: string): Promise<Coach> {
  return api.get<Coach>(`/coaches/${id}`);
}

export async function createCollaborationRequest(
  payload: Omit<CollaborationRequest, "id" | "createdAt" | "status"> & {
    status?: CollaborationRequest["status"];
  },
): Promise<CollaborationRequest> {
  return api.post<CollaborationRequest>("/collaborationRequests", {
    ...payload,
    status: payload.status ?? "pending",
    createdAt: new Date().toISOString(),
  });
}

export async function getMyCollaborationRequests(
  userId: string,
): Promise<CollaborationRequest[]> {
  return api.get<CollaborationRequest[]>(
    `/collaborationRequests?userId=${userId}`,
  );
}

export async function cancelCollaborationRequest(
  id: string,
): Promise<CollaborationRequest> {
  return api.patch<CollaborationRequest>(`/collaborationRequests/${id}`, {
    status: "cancelled",
  });
}

export async function deleteCollaborationRequest(id: string): Promise<void> {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/collaborationRequests/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to delete request");
    }
  } catch (error) {
    console.error("Delete request error:", error);
    throw error;
  }
}
