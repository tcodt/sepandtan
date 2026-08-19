import { api } from "./client";
import type { UserProfile, BodyInfo, Equipment, Goal } from "@/lib/types/plan";

export async function getUserById(id: string): Promise<UserProfile> {
  return api.get<UserProfile>(`/users/${id}`);
}

export async function findUserByEmail(
  email: string,
): Promise<UserProfile | null> {
  const users = await api.get<UserProfile[]>(
    `/users?email=${encodeURIComponent(email)}`,
  );
  return users[0] ?? null;
}

export async function findUserByPhone(
  phone: string,
): Promise<UserProfile | null> {
  const users = await api.get<UserProfile[]>(
    `/users?phone=${encodeURIComponent(phone)}`,
  );
  return users[0] ?? null;
}

export async function createUser(data: {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  avatarUrl?: string;
}): Promise<UserProfile> {
  return api.post<UserProfile>("/users", {
    ...data,
    role: "user",
    onboardingCompleted: false,
    currentPlanId: null,
    subscriptionStatus: "free",
    createdAt: new Date().toISOString(),
  });
}

export async function updateUser(
  id: string,
  data: Partial<UserProfile>,
): Promise<UserProfile> {
  return api.patch<UserProfile>(`/users/${id}`, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

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
    subscriptionStatus: "ai_plan",
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
