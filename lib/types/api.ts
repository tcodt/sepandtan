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
  /** Some backends return token in body; optional for flexibility */
  accessToken?: string;
  token?: string;
};

export type ProfileDto = {
  id?: string;
  // fitness-related fields already present in swagger ProfileDto
  gender?: "MALE" | "FEMALE" | "OTHER" | null;
  trainingLocation?: "HOME" | "GYM" | "BOTH" | null;
  age?: string | null;
  trainingDaysPerWeek?: number | null;
  // extend when needed
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

export type ApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
  error?: string;
};
