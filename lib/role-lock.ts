import type {
  ProfessionalRoleLock,
  UserProfile,
  UserRole,
} from "@/lib/types/plan";
import type { BackendRole } from "@/lib/types/api";

export function lockFromRole(
  role: UserRole | BackendRole | string | null | undefined,
): ProfessionalRoleLock | null {
  if (role === "coach" || role === "COACH") return "coach";
  if (role === "seller" || role === "STORE") return "seller";
  return null;
}

/** قفل قبلی هرگز با null پاک نمی‌شود */
export function mergeProfessionalLock(
  previous: ProfessionalRoleLock | null | undefined,
  nextFromRole: ProfessionalRoleLock | null | undefined,
): ProfessionalRoleLock | null {
  return previous ?? nextFromRole ?? null;
}

export function canRequestProfessionalRole(
  user: Pick<UserProfile, "professionalRoleLock" | "role"> | null | undefined,
  target: ProfessionalRoleLock,
): { ok: true } | { ok: false; message: string } {
  if (!user) return { ok: false, message: "کاربر یافت نشد" };

  const lock = user.professionalRoleLock ?? lockFromRole(user.role);

  if (lock && lock !== target) {
    return {
      ok: false,
      message:
        lock === "coach"
          ? "این حساب مسیر مربی را انتخاب کرده و نمی‌تواند فروشنده شود."
          : "این حساب مسیر فروشنده را انتخاب کرده و نمی‌تواند مربی شود.",
    };
  }

  return { ok: true };
}

export function canAdminAssignRole(
  currentRole: BackendRole,
  currentLock: ProfessionalRoleLock | null | undefined,
  nextRole: BackendRole,
): { ok: true } | { ok: false; message: string } {
  const lock = currentLock ?? lockFromRole(currentRole);

  if (nextRole === "COACH" && lock === "seller") {
    return {
      ok: false,
      message:
        "این کاربر قفل فروشنده دارد. حتی پس از تبدیل به کاربر عادی نمی‌تواند مربی شود.",
    };
  }

  if (nextRole === "STORE" && lock === "coach") {
    return {
      ok: false,
      message:
        "این کاربر قفل مربی دارد. حتی پس از تبدیل به کاربر عادی نمی‌تواند فروشنده شود.",
    };
  }

  if (
    (currentRole === "STORE" && nextRole === "COACH") ||
    (currentRole === "COACH" && nextRole === "STORE")
  ) {
    return {
      ok: false,
      message: "نقش مربی و فروشنده متقابل انحصاری‌اند.",
    };
  }

  return { ok: true };
}

/* -------------------------------------------------------------------------- */
/* Admin session memory (تا وقتی بک‌اند history بدهد)                        */
/* -------------------------------------------------------------------------- */

const ADMIN_LOCKS_KEY = "sepandtan_admin_role_locks";

export function loadAdminRoleLocks(): Record<string, ProfessionalRoleLock> {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(ADMIN_LOCKS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const out: Record<string, ProfessionalRoleLock> = {};
    for (const [id, v] of Object.entries(parsed)) {
      if (v === "coach" || v === "seller") out[id] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function saveAdminRoleLocks(
  map: Record<string, ProfessionalRoleLock>,
): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ADMIN_LOCKS_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function rememberAdminRoleLock(
  userId: string,
  lock: ProfessionalRoleLock,
): void {
  const map = loadAdminRoleLocks();
  if (map[userId] === lock) return;
  map[userId] = lock;
  saveAdminRoleLocks(map);
}

export function getAdminRoleLock(
  userId: string,
  currentRole: BackendRole,
): ProfessionalRoleLock | null {
  const map = loadAdminRoleLocks();
  return map[userId] ?? lockFromRole(currentRole);
}
