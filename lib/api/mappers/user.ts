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
  BodyInfo,
  ActivityLevel,
  Gender,
  Equipment,
  Goal,
} from "@/lib/types/plan";

/* -------------------------------------------------------------------------- */
/* Role & Status                                                              */
/* -------------------------------------------------------------------------- */

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

/**
 * وضعیت حساب کاربر در بک‌اند:
 * ACTIVE | SUSPENDED | DELETED
 * → roleStatus فرانت
 */
function mapAccountStatus(status?: string | null): RoleStatus {
  if (status === "SUSPENDED") return "suspended";
  if (status === "DELETED") return "rejected";
  return "approved";
}

/* -------------------------------------------------------------------------- */
/* Profile field mappers                                                      */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Auth → UserProfile                                                         */
/* -------------------------------------------------------------------------- */

/** از پاسخ login / register */
export function mapAuthToUserProfile(auth: AuthEntities): UserProfile {
  const role = mapRole(auth.role);

  return {
    id: auth.id,
    name: auth.name,
    email: asOptionalString(auth.email),
    phone: asOptionalString(auth.phone),
    role,
    roles: [role],
    roleStatus: "approved",
    onboardingStatus: role === "trainee" ? "not_started" : "completed",
    currentOnboardingStep: role === "trainee" ? 1 : 0,
    onboardingCompleted: role !== "trainee",
    subscriptionStatus: "free",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Profile response → UserProfile                                             */
/* -------------------------------------------------------------------------- */

/** از GET /user/profile */
export function mapProfileResponseToUser(
  res: UserProfileResponseDto,
): UserProfile {
  const role = mapRole(res.role);
  const bodyInfo = extractBodyInfo(res.profile ?? null);
  const equipment = mapTrainingLocation(res.profile?.trainingLocation);
  const targetWeight = res.profile?.targetWeightKg ?? undefined;

  const hasBodyInfo = Boolean(bodyInfo);
  const onboardingCompleted =
    role !== "trainee" ||
    hasBodyInfo ||
    Boolean(res.profile?.onboardingCompleted);

  return {
    id: res.id,
    name: res.name,
    email: asOptionalString(res.email),
    phone: asOptionalString(res.phone),
    avatarUrl: asOptionalString(res.profile?.avatar) ?? undefined,
    role,
    roles: [role],
    roleStatus: mapAccountStatus(res.status),
    onboardingStatus: onboardingCompleted
      ? "completed"
      : hasBodyInfo
        ? "in_progress"
        : "not_started",
    currentOnboardingStep: onboardingCompleted ? 0 : 1,
    onboardingCompleted,
    bodyInfo,
    equipment,
    targetWeight,
    subscriptionStatus: "free",
    createdAt: res.createdAt,
    updatedAt: new Date().toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/* Onboarding → UpdateProfileDto                                              */
/* -------------------------------------------------------------------------- */

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

/** تبدیل داده‌های onboarding فرانت به UpdateProfileDto بک‌اند */
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
