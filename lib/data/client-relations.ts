import type { ClientRelation } from "@/lib/types/client-relation";

/**
 * روابط پایدار مربی-هنرجو (بعد از Accept درخواست)
 */
export const clientRelations: ClientRelation[] = [
  {
    id: "cr_001",
    coachId: "coach_1",
    clientId: "user_demo_1",
    status: "active",
    collaborationRequestId: "req_001",
    startedAt: "2026-08-25T15:30:00.000Z",
    endedAt: null,
    notes: "رابطه فعال نمونه برای تست پنل مربی",
    createdAt: "2026-08-25T15:30:00.000Z",
  },
];
