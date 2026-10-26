import type {
  UserProfile,
  BodyInfo,
  Equipment,
  Goal,
  UserRole,
  RoleStatus,
} from "@/lib/types/plan";
import { db } from "./db";
import { createId, delay } from "./client";

export async function getUserById(id: string): Promise<UserProfile> {
  await delay();
  const user = db.users.find((u) => u.id === id);
  if (!user) throw new Error(`کاربر پیدا نشد: ${id}`);
  return { ...user };
}

export async function findUserByEmail(
  email: string,
): Promise<UserProfile | null> {
  await delay();
  const user = db.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  return user ? { ...user } : null;
}

export async function findUserByPhone(
  phone: string,
): Promise<UserProfile | null> {
  await delay();
  const user = db.users.find((u) => u.phone === phone);
  return user ? { ...user } : null;
}

export async function createUser(data: {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  await delay();

  const user: UserProfile = {
    id: createId("user"),
    name: data.name,
    email: data.email,
    phone: data.phone,
    password: data.password,
    avatarUrl: data.avatarUrl,
    role: "trainee", // پیش‌فرض
    roleStatus: "approved",
    roles: ["trainee"],
    onboardingStatus: "not_started",
    currentOnboardingStep: 1,
    onboardingCompleted: false,
    currentPlanId: null,
    subscriptionStatus: "free",
    createdAt: new Date().toISOString(),
  };

  db.users.push(user);
  return { ...user };
}

export async function updateUser(
  id: string,
  data: Partial<UserProfile>,
): Promise<UserProfile> {
  await delay();

  const index = db.users.findIndex((u) => u.id === id);
  if (index === -1) throw new Error(`کاربر پیدا نشد: ${id}`);

  const updated: UserProfile = {
    ...db.users[index],
    ...data,
    id, // id قابل تغییر نباشد
    updatedAt: new Date().toISOString(),
  };

  db.users[index] = updated;
  return { ...updated };
}

export async function setUserRole(
  userId: string,
  role: UserRole,
  status: RoleStatus = "approved",
): Promise<UserProfile> {
  return updateUser(userId, {
    role,
    roleStatus: status,
    roles: [role],
  });
}

export async function requestRoleUpgrade(
  userId: string,
  role: "coach" | "seller",
): Promise<UserProfile> {
  return updateUser(userId, {
    role,
    roleStatus: "pending",
    roles: [role],
  });
}

export async function updateOnboardingProgress(
  userId: string,
  step: number,
): Promise<UserProfile> {
  return updateUser(userId, {
    currentOnboardingStep: step,
    onboardingStatus: "in_progress",
  });
}

/**
 * آنبوردینگ فقط Training Plan را ست می‌کند.
 * اشتراک را عوض نمی‌کند (جداسازی قفل‌شده محصول).
 */
export async function completeUserOnboarding(
  userId: string,
  payload: {
    bodyInfo: BodyInfo;
    equipment: Equipment;
    goal: Goal;
    currentPlanId: string;
    targetWeight?: number;
  },
): Promise<UserProfile> {
  return updateUser(userId, {
    bodyInfo: payload.bodyInfo,
    equipment: payload.equipment,
    goal: payload.goal,
    currentPlanId: payload.currentPlanId,
    targetWeight: payload.targetWeight,
    onboardingCompleted: true,
    onboardingStatus: "completed",
    currentOnboardingStep: 0,
  });
}

export async function loginWithEmail(
  email: string,
  password: string,
): Promise<UserProfile> {
  const user = await findUserByEmail(email);
  if (!user) throw new Error("کاربری با این ایمیل پیدا نشد");
  if (user.password && user.password !== password) {
    throw new Error("رمز عبور اشتباه است");
  }
  return user;
}

export async function loginWithPhone(
  phone: string,
  password: string,
): Promise<UserProfile> {
  const user = await findUserByPhone(phone);
  if (!user) throw new Error("کاربری با این شماره پیدا نشد");
  if (user.password && user.password !== password) {
    throw new Error("رمز عبور اشتباه است");
  }
  return user;
}
