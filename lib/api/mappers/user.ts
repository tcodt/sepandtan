import type {
  AuthEntities,
  UserProfileResponseDto,
  BackendRole,
  ProfileDto,
  ActivityLevelBackend,
  GenderBackend,
  TrainingLocationBackend,
  UpdateProfileDto,
} from "@/lib/types/api";
import type {
  UserProfile,
  UserRole,
  RoleStatus,
  AccountStatus,
  BodyInfo,
  ActivityLevel,
  Gender,
  Equipment,
  Goal,
} from "@/lib/types/plan";
import { lockFromRole } from "@/lib/role-lock";

function mapRole(role: BackendRole | string | undefined | null): UserRole {
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

function mapAccountStatus(status?: string | null): AccountStatus {
  if (status === "SUSPENDED") return "SUSPENDED";
  if (status === "DELETED") return "DELETED";
  return "ACTIVE";
}

/**
 * roleStatus نقش تخصصی است، نه status حساب.
 * تعلیق/حذف حساب → suspended/rejected
 * pending واقعی از requestRole لوکال / role-pending sync می‌آید
 */
function mapRoleStatus(
  role: UserRole,
  accountStatus: AccountStatus,
): RoleStatus {
  if (accountStatus === "SUSPENDED") return "suspended";
  if (accountStatus === "DELETED") return "rejected";
  if (role === "coach" || role === "seller") return "approved";
  return "approved";
}

function mapActivityLevel(
  level?: ActivityLevelBackend | string | null,
): ActivityLevel | undefined {
  if (!level) return undefined;
  const map: Record<string, ActivityLevel> = {
    SEDENTARY: "sedentary",
    LIGHT: "light",
    MODERATE: "moderate",
    ACTIVE: "active",
    VERY_ACTIVE: "very_active",
  };
  return map[level];
}

function mapGender(g?: GenderBackend | string | null): Gender | undefined {
  if (!g) return undefined;
  if (g === "MALE") return "male";
  if (g === "FEMALE") return "female";
  return undefined;
}

function mapTrainingLocation(
  loc?: TrainingLocationBackend | string | null,
): Equipment | undefined {
  if (!loc) return undefined;
  if (loc === "HOME") return "home";
  if (loc === "GYM") return "gym";
  if (loc === "BOTH") return "both";
  return undefined;
}

function extractAge(ageValue?: string | null): number | undefined {
  if (!ageValue) return undefined;
  const asNumber = Number(ageValue);
  if (Number.isFinite(asNumber) && asNumber > 0 && asNumber < 120) {
    return Math.round(asNumber);
  }
  const birth = new Date(ageValue);
  if (Number.isNaN(birth.getTime())) return undefined;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age > 0 && age < 120 ? age : undefined;
}

function extractBodyInfo(profile?: ProfileDto | null): BodyInfo | undefined {
  if (!profile) return undefined;

  const gender = mapGender(profile.gender);
  const activityLevel = mapActivityLevel(profile.activityLevel);
  const height = profile.heightCm ?? undefined;
  const weight = profile.currentWeightKg ?? undefined;
  const age = extractAge(profile.age ?? null);

  if (
    gender == null ||
    activityLevel == null ||
    height == null ||
    weight == null ||
    age == null
  ) {
    return undefined;
  }

  return { gender, age, height, weight, activityLevel };
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "value" in (value as object)) {
    return asOptionalString((value as { value: unknown }).value);
  }
  return undefined;
}

function resolveOnboarding(role: UserRole, profile?: ProfileDto | null) {
  if (role !== "trainee") {
    return {
      onboardingCompleted: true,
      onboardingStatus: "completed" as const,
      currentOnboardingStep: 0,
    };
  }

  if (profile?.onboardingCompleted === true) {
    return {
      onboardingCompleted: true,
      onboardingStatus: "completed" as const,
      currentOnboardingStep: 0,
    };
  }

  const bodyInfo = extractBodyInfo(profile ?? null);
  const equipment = mapTrainingLocation(profile?.trainingLocation);

  if (bodyInfo && equipment) {
    return {
      onboardingCompleted: true,
      onboardingStatus: "completed" as const,
      currentOnboardingStep: 0,
    };
  }

  if (bodyInfo || equipment) {
    return {
      onboardingCompleted: false,
      onboardingStatus: "in_progress" as const,
      currentOnboardingStep: bodyInfo ? 2 : 1,
    };
  }

  return {
    onboardingCompleted: false,
    onboardingStatus: "not_started" as const,
    currentOnboardingStep: 1,
  };
}

export function mapAuthToUserProfile(auth: AuthEntities): UserProfile {
  const role = mapRole(auth.role);
  const onboarding = resolveOnboarding(role, null);

  return {
    id: auth.id,
    name: auth.name,
    email: asOptionalString(auth.email),
    phone: asOptionalString(auth.phone),
    role,
    roles: [role],
    accountStatus: "ACTIVE",
    roleStatus: "approved",
    professionalRoleLock: lockFromRole(role),
    ...onboarding,
    subscriptionStatus: "free",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function mapProfileResponseToUser(
  res: UserProfileResponseDto,
): UserProfile {
  const role = mapRole(res.role);
  const accountStatus = mapAccountStatus(res.status);
  const bodyInfo = extractBodyInfo(res.profile ?? null);
  const equipment = mapTrainingLocation(res.profile?.trainingLocation);
  const targetWeight = res.profile?.targetWeightKg ?? undefined;
  const onboarding = resolveOnboarding(role, res.profile ?? null);

  return {
    id: res.id,
    name: res.name,
    email: asOptionalString(res.email),
    phone: asOptionalString(res.phone),
    avatarUrl: asOptionalString(res.profile?.avatar) ?? undefined,
    role,
    roles: [role],
    accountStatus,
    roleStatus: mapRoleStatus(role, accountStatus),
    professionalRoleLock: lockFromRole(role),
    ...onboarding,
    bodyInfo,
    equipment,
    targetWeight,
    subscriptionStatus: "free",
    createdAt: res.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

function toBackendActivity(level: ActivityLevel): ActivityLevelBackend {
  const map: Record<ActivityLevel, ActivityLevelBackend> = {
    sedentary: "SEDENTARY",
    light: "LIGHT",
    moderate: "MODERATE",
    active: "ACTIVE",
    very_active: "VERY_ACTIVE",
  };
  return map[level];
}

function toBackendGender(g: Gender): GenderBackend {
  return g === "male" ? "MALE" : "FEMALE";
}

function toBackendLocation(eq: Equipment): TrainingLocationBackend {
  if (eq === "home") return "HOME";
  if (eq === "gym") return "GYM";
  return "BOTH";
}

export function mapOnboardingToUpdateProfileDto(input: {
  bodyInfo: BodyInfo;
  equipment: Equipment;
  goal?: Goal;
  targetWeight?: number;
}): UpdateProfileDto {
  const { bodyInfo, equipment, targetWeight } = input;
  const birthYear = new Date().getFullYear() - bodyInfo.age;
  const ageDate = `${birthYear}-01-01`;

  return {
    gender: toBackendGender(bodyInfo.gender),
    heightCm: bodyInfo.height,
    currentWeightKg: bodyInfo.weight,
    targetWeightKg: targetWeight ?? null,
    activityLevel: toBackendActivity(bodyInfo.activityLevel),
    trainingLocation: toBackendLocation(equipment),
    age: ageDate,
  };
}
