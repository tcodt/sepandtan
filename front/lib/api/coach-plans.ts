import { db } from "./db";
import type { Plan, PlanStatus } from "@/lib/types/plan";
import type { ClientRelation } from "@/lib/types/client-relation";
import { createId, delay } from "./client";

/** Accept درخواست همکاری → ساخت ClientRelation */
export async function acceptCollaborationRequest(
  requestId: string,
): Promise<ClientRelation> {
  await delay();

  const request = db.collaborationRequests.find((r) => r.id === requestId);
  if (!request) throw new Error(`درخواست پیدا نشد: ${requestId}`);
  if (request.status !== "pending") {
    throw new Error("این درخواست قبلاً پاسخ داده شده است");
  }

  const now = new Date().toISOString();

  // آپدیت وضعیت درخواست
  request.status = "accepted";
  request.acceptedAt = now;
  request.respondedAt = now;

  // ساخت رابطه پایدار
  const relation: ClientRelation = {
    id: createId("cr"),
    coachId: request.coachId,
    clientId: request.userId,
    status: "active",
    collaborationRequestId: request.id,
    startedAt: now,
    endedAt: null,
    createdAt: now,
  };

  db.clientRelations.push(relation);
  return { ...relation };
}

/** رد درخواست */
export async function rejectCollaborationRequest(
  requestId: string,
  reason?: string,
): Promise<void> {
  await delay();

  const request = db.collaborationRequests.find((r) => r.id === requestId);
  if (!request) throw new Error(`درخواست پیدا نشد: ${requestId}`);
  if (request.status !== "pending") {
    throw new Error("این درخواست قبلاً پاسخ داده شده است");
  }

  const now = new Date().toISOString();
  request.status = "rejected";
  request.rejectionReason = reason ?? null;
  request.respondedAt = now;
}

/** لیست روابط فعال یک مربی */
export async function getClientRelationsForCoach(
  coachId: string,
): Promise<ClientRelation[]> {
  await delay();
  return db.clientRelations
    .filter((r) => r.coachId === coachId && r.status === "active")
    .map((r) => ({ ...r }));
}

/** ساخت Draft برنامه مربی */
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
    priceToman: data.priceToman ?? null,
    days: data.days ?? [],
    createdAt: now,
    source: "coach",
    coachId,
    status: "draft",
    patternType: "weekly",
    durationWeeks,
    weeklyTemplate: data.weeklyTemplate ?? [],
    clientRelationId: null,
    publishedAt: null,
    assignedAt: null,
    activatedAt: null,
  };

  db.plans.push(plan);
  return { ...plan };
}

/** آپدیت Draft */
export async function updateCoachPlanDraft(
  planId: string,
  data: Partial<Plan>,
): Promise<Plan> {
  await delay();

  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) throw new Error(`برنامه پیدا نشد: ${planId}`);
  if (plan.source !== "coach") {
    throw new Error("فقط برنامه‌های مربی قابل ویرایش هستند");
  }
  if (plan.status !== "draft") {
    throw new Error("فقط Draft قابل ویرایش است");
  }

  // فقط فیلدهای مجاز را آپدیت کن
  if (data.title !== undefined) plan.title = data.title;
  if (data.description !== undefined) plan.description = data.description;
  if (data.goal !== undefined) plan.goal = data.goal;
  if (data.equipment !== undefined) plan.equipment = data.equipment;
  if (data.level !== undefined) plan.level = data.level;
  if (data.durationWeeks !== undefined) {
    plan.durationWeeks = data.durationWeeks;
    plan.durationDays = data.durationWeeks * 7;
  }
  if (data.weeklyTemplate !== undefined) {
    plan.weeklyTemplate = data.weeklyTemplate;
  }
  if (data.days !== undefined) {
    plan.days = data.days;
  }
  if (data.priceToman !== undefined) plan.priceToman = data.priceToman;

  return { ...plan };
}

/** Publish کردن Draft */
export async function publishCoachPlan(planId: string): Promise<Plan> {
  await delay();

  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) throw new Error(`برنامه پیدا نشد: ${planId}`);
  if (plan.status !== "draft") {
    throw new Error("فقط Draft قابل انتشار است");
  }
  if (!plan.weeklyTemplate || plan.weeklyTemplate.length !== 7) {
    throw new Error("الگوی هفتگی باید دقیقاً ۷ روز داشته باشد");
  }

  plan.status = "published";
  plan.publishedAt = new Date().toISOString();
  return { ...plan };
}

/** لیست برنامه‌های یک مربی */
export async function getCoachPlans(
  coachId: string,
  status?: PlanStatus,
): Promise<Plan[]> {
  await delay();
  return db.plans
    .filter((p) => {
      if (p.coachId !== coachId || p.source !== "coach") return false;
      if (status && p.status !== status) return false;
      return true;
    })
    .map((p) => ({ ...p }));
}

/** Assign برنامه به هنرجو (بدون Activate) */
export async function assignPlanToClient(
  planId: string,
  clientId: string,
  clientRelationId: string,
): Promise<Plan> {
  await delay();

  const plan = db.plans.find((p) => p.id === planId);
  if (!plan) throw new Error(`برنامه پیدا نشد: ${planId}`);
  if (plan.status !== "published") {
    throw new Error("فقط برنامه‌های Published قابل Assign هستند");
  }

  plan.status = "assigned";
  plan.userId = clientId;
  plan.clientRelationId = clientRelationId;
  plan.assignedAt = new Date().toISOString();
  return { ...plan };
}

/**
 * Deep clone برای weeklyTemplate / days تا template منتشرشده دست‌نخورده بماند
 */
function clonePlanDays(
  days: Plan["days"] | Plan["weeklyTemplate"],
): NonNullable<Plan["days"]> {
  if (!days) return [];
  return days.map((d) => ({
    ...d,
    exercises: d.exercises.map((e) => ({ ...e })),
    meals: d.meals.map((m) => ({ ...m })),
  }));
}

/**
 * Activate برنامه مربی برای کاربر
 * قانون «فقط یک Active Plan» اینجا متمرکز و غیرقابل‌نقض است
 *
 * - اگر status = published → از روی template یک کپی می‌سازد و همان کپی را active می‌کند
 *   (template منتشرشده برای هنرجوهای بعدی باقی می‌ماند)
 * - اگر status = assigned → همان instance را active می‌کند
 */
export async function activateCoachPlanForUser(
  planId: string,
  userId: string,
): Promise<Plan> {
  await delay();

  const sourcePlan = db.plans.find((p) => p.id === planId);
  if (!sourcePlan) throw new Error(`برنامه پیدا نشد: ${planId}`);
  if (sourcePlan.source !== "coach") {
    throw new Error("فقط برنامه مربی قابل فعال‌سازی است");
  }
  if (sourcePlan.status !== "published" && sourcePlan.status !== "assigned") {
    throw new Error("وضعیت برنامه برای فعال‌سازی مناسب نیست");
  }

  const user = db.users.find((u) => u.id === userId);
  if (!user) throw new Error(`کاربر پیدا نشد: ${userId}`);

  const now = new Date().toISOString();

  // ۱. Archive کردن Active قبلی کاربر
  if (user.currentPlanId) {
    const oldPlan = db.plans.find((p) => p.id === user.currentPlanId);
    if (oldPlan && oldPlan.status === "active") {
      oldPlan.status = "archived";
    }
  }

  let activePlan: Plan;

  if (sourcePlan.status === "published") {
    // ۲-الف. کپی از template — template published می‌ماند
    activePlan = {
      ...sourcePlan,
      id: createId("plan"),
      userId,
      status: "active",
      startDate: now,
      activatedAt: now,
      assignedAt: now,
      days: clonePlanDays(sourcePlan.days),
      weeklyTemplate: sourcePlan.weeklyTemplate
        ? clonePlanDays(sourcePlan.weeklyTemplate)
        : undefined,
    };
    db.plans.push(activePlan);
  } else {
    // ۲-ب. assigned → همان را active کن
    sourcePlan.status = "active";
    sourcePlan.userId = userId;
    sourcePlan.startDate = now;
    sourcePlan.activatedAt = now;
    activePlan = sourcePlan;
  }

  // ۳. ست کردن currentPlanId
  user.currentPlanId = activePlan.id;
  user.updatedAt = now;

  return {
    ...activePlan,
    days: clonePlanDays(activePlan.days),
    weeklyTemplate: activePlan.weeklyTemplate
      ? clonePlanDays(activePlan.weeklyTemplate)
      : undefined,
  };
}

/** خلاصه پیشرفت هنرجو برای پنل مربی (MVP) */
export async function getClientProgressSummary(
  clientId: string,
  coachId: string,
) {
  await delay();

  const relation = db.clientRelations.find(
    (r) =>
      r.clientId === clientId && r.coachId === coachId && r.status === "active",
  );

  if (!relation) {
    return {
      lastWeight: null as number | null,
      sessionsLast7Days: 0,
      planStatus: null as PlanStatus | null,
      currentPlanTitle: undefined as string | undefined,
    };
  }

  const user = db.users.find((u) => u.id === clientId);
  const currentPlan = user?.currentPlanId
    ? db.plans.find((p) => p.id === user.currentPlanId)
    : null;

  // آخرین وزن
  const weights = db.weightLogs
    .filter((w) => w.userId === clientId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const lastWeight = weights[0]?.weight ?? null;

  // تعداد جلسات ۷ روز اخیر
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sessionsLast7Days = db.workoutLogs.filter((l) => {
    if (l.userId !== clientId) return false;
    return new Date(l.date) >= sevenDaysAgo;
  }).length;

  return {
    lastWeight,
    sessionsLast7Days,
    planStatus: (currentPlan?.status as PlanStatus) ?? null,
    currentPlanTitle: currentPlan?.title,
  };
}

export async function deleteCoachPlan(planId: string): Promise<void> {
  await delay();

  const index = db.plans.findIndex((p) => p.id === planId);
  if (index === -1) throw new Error("برنامه پیدا نشد");

  const plan = db.plans[index];
  if (plan.source !== "coach") {
    throw new Error("فقط برنامه مربی قابل حذف است");
  }

  // فقط draft یا published بدون کاربر
  if (plan.status === "active" || plan.status === "assigned") {
    throw new Error("برنامه فعال یا اختصاص‌یافته قابل حذف نیست");
  }

  db.plans.splice(index, 1);
}
