import type {
  AuthEntities,
  UserProfileResponseDto,
  BackendRole,
} from "@/lib/types/api";
import type { UserProfile, UserRole, RoleStatus } from "@/lib/types/plan";

function mapRole(role: BackendRole): UserRole {
  switch (role) {
    case "COACH":
      return "coach";
    case "STORE":
      return "seller";
    case "ADMIN":
    case "SUPERADMIN":
      return "admin";
    case "USER":
    case "AUTHOR":
    default:
      return "trainee";
  }
}

function mapStatus(status?: string): RoleStatus {
  if (status === "SUSPENDED") return "suspended";
  if (status === "DELETED") return "rejected";
  return "approved";
}

/** از پاسخ login/register */
export function mapAuthToUserProfile(auth: AuthEntities): UserProfile {
  const role = mapRole(auth.role);

  return {
    id: auth.id,
    name: auth.name,
    email: auth.email ?? undefined,
    phone: auth.phone ?? undefined,
    role,
    roles: [role],
    roleStatus: "approved",
    onboardingStatus: role === "trainee" ? "not_started" : "completed",
    currentOnboardingStep: 0,
    onboardingCompleted: role !== "trainee",
    subscriptionStatus: "free",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/** از GET /user/profile */
export function mapProfileResponseToUser(
  res: UserProfileResponseDto,
): UserProfile {
  const role = mapRole(res.role);

  return {
    id: res.id,
    name: res.name,
    email: res.email ?? undefined,
    phone: res.phone ?? undefined,
    role,
    roles: [role],
    roleStatus: mapStatus(res.status),
    onboardingStatus: role === "trainee" ? "not_started" : "completed",
    currentOnboardingStep: 0,
    onboardingCompleted: role !== "trainee",
    subscriptionStatus: "free",
    createdAt: res.createdAt,
    updatedAt: new Date().toISOString(),
    // در صورت نیاز فیلدهای profile را map کنید
  };
}
