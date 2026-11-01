export type BackendRole =
  | "USER"
  | "ADMIN"
  | "SUPERADMIN"
  | "AUTHOR"
  | "COACH"
  | "STORE";

export type BackendUserStatus = "ACTIVE" | "SUSPENDED" | "DELETED";

export type LoginDto = {
  email?: string;
  password?: string;
  googleIdToken?: string;
};

export type RegisterDto = {
  name?: string;
  email?: string;
  phone?: string;
  password?: string;
  googleIdToken?: string;
};

/** Response of POST /auth/login and /auth/register */
export type AuthEntities = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  googleId?: string | null;
  role: BackendRole;
  accessToken?: string;
  token?: string;
};

export type ActivityLevelBackend =
  | "SEDENTARY"
  | "LIGHT"
  | "MODERATE"
  | "ACTIVE"
  | "VERY_ACTIVE";

export type ExperienceLevelBackend = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";

export type GenderBackend = "MALE" | "FEMALE" | "OTHER";

export type TrainingLocationBackend = "HOME" | "GYM" | "BOTH";

export type ProfileDto = {
  id?: string;
  userId?: string;
  avatar?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  heightCm?: number | null;
  currentWeightKg?: number | null;
  targetWeightKg?: number | null;
  activityLevel?: ActivityLevelBackend | null;
  experienceLevel?: ExperienceLevelBackend | null;
  gender?: GenderBackend | null;
  trainingLocation?: TrainingLocationBackend | null;
  age?: string | null; // date string
  trainingDaysPerWeek?: number | null;
  availableEquipment?: string[] | null;
  injuries?: string | null;
  medicalConditions?: string | null;
  allergies?: string[] | null;
  dietaryRestrictions?: string[] | null;
  [key: string]: unknown;
};

export type UserProfileResponseDto = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role: BackendRole;
  status: BackendUserStatus;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  profile?: ProfileDto | null;
};

export type UpdateProfileDto = {
  avatar?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  heightCm?: number | null;
  currentWeightKg?: number | null;
  targetWeightKg?: number | null;
  activityLevel?: ActivityLevelBackend | null;
  experienceLevel?: ExperienceLevelBackend | null;
  gender?: GenderBackend | null;
  trainingLocation?: TrainingLocationBackend | null;
  age?: string | null;
  trainingDaysPerWeek?: number | null;
  availableEquipment?: string[] | null;
  injuries?: string | null;
  medicalConditions?: string | null;
  allergies?: string[] | null;
  dietaryRestrictions?: string[] | null;
};

export type ApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
  error?: string;
};
