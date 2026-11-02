import { apiClient } from "@/lib/api/client";
import type { CreateReportInput } from "./types";

/** POST /reports */
export async function createReport(
  payload: CreateReportInput,
): Promise<unknown> {
  const { data } = await apiClient.post("/reports", payload);
  return data;
}

/** GET /reports/admin/all */
export async function fetchAdminReports(params?: Record<string, unknown>) {
  const { data } = await apiClient.get("/reports/admin/all", { params });
  return data;
}

/** GET /reports/admin/stats */
export async function fetchReportStats() {
  const { data } = await apiClient.get("/reports/admin/stats");
  return data;
}

/** GET /reports/{id} */
export async function fetchReportById(id: string) {
  const { data } = await apiClient.get(`/reports/${id}`);
  return data;
}

/** PATCH /reports/{id}/status */
export async function updateReportStatus(
  id: string,
  status: string,
): Promise<void> {
  await apiClient.patch(`/reports/${id}/status`, { status });
}

/** DELETE /reports/{id} */
export async function deleteReport(id: string): Promise<void> {
  await apiClient.delete(`/reports/${id}`);
}
