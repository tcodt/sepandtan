import { apiClient, setAccessToken, getAccessToken } from "@/lib/api/client";
import type {
  AuthEntities,
  LoginDto,
  RegisterDto,
  UserProfileResponseDto,
  UpdateProfileDto,
} from "@/lib/types/api";

function asPlainString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value && typeof value === "object" && "value" in value) {
    return asPlainString((value as { value: unknown }).value);
  }
  return null;
}

/** نرمال‌سازی شکل‌های مختلف پاسخ auth */
export function normalizeAuthPayload(raw: unknown): AuthEntities {
  const root = (raw ?? {}) as Record<string, unknown>;
  const nested =
    (root.data as Record<string, unknown> | undefined) ??
    (root.user as Record<string, unknown> | undefined) ??
    root;

  const roleRaw = asPlainString(nested.role) ?? "USER";

  return {
    id: asPlainString(nested.id) ?? "",
    name: asPlainString(nested.name) ?? "",
    email: asPlainString(nested.email),
    phone: asPlainString(nested.phone),
    googleId: asPlainString(nested.googleId),
    role: roleRaw as AuthEntities["role"],
    status:
      (asPlainString(nested.status) as AuthEntities["status"]) ?? undefined,
    accessToken:
      asPlainString(nested.accessToken) ??
      asPlainString(nested.token) ??
      asPlainString(nested.access_token) ??
      asPlainString(root.accessToken) ??
      asPlainString(root.token) ??
      asPlainString(root.access_token) ??
      undefined,
    token:
      asPlainString(nested.token) ?? asPlainString(root.token) ?? undefined,
  };
}

function extractToken(data: AuthEntities): string | null {
  return data.accessToken ?? data.token ?? data.access_token ?? null;
}

export async function loginRequest(dto: LoginDto): Promise<AuthEntities> {
  const { data } = await apiClient.post("/auth/login", dto);
  const auth = normalizeAuthPayload(data);
  const token = extractToken(auth);

  if (!token) {
    // اگر withCredentials + cookie-only باشد ممکن است توکن در body نباشد
    // ولی برای Bearer فعلی بدون توکن profile بعدی fail می‌شود
    console.warn("[auth] login response has no accessToken/token field", data);
  } else {
    setAccessToken(token);
  }

  if (!auth.id) {
    throw new Error("پاسخ ورود نامعتبر است (id ندارد)");
  }

  return auth;
}

export async function registerRequest(dto: RegisterDto): Promise<AuthEntities> {
  const { data } = await apiClient.post("/auth/register", dto);
  const auth = normalizeAuthPayload(data);
  const token = extractToken(auth);

  if (token) setAccessToken(token);
  else
    console.warn(
      "[auth] register response has no accessToken/token field",
      data,
    );

  if (!auth.id) {
    throw new Error("پاسخ ثبت‌نام نامعتبر است (id ندارد)");
  }

  return auth;
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiClient.delete("/auth");
  } finally {
    setAccessToken(null);
  }
}

export async function getMyProfile(): Promise<UserProfileResponseDto> {
  const { data } = await apiClient.get("/user/profile");
  const r = (data ?? {}) as Record<string, unknown>;

  // اگر backend داخل data بپیچد
  const src =
    r.id != null ? r : ((r.data as Record<string, unknown> | undefined) ?? r);

  return {
    id: asPlainString(src.id) ?? "",
    name: asPlainString(src.name) ?? "",
    email: asPlainString(src.email),
    phone: asPlainString(src.phone),
    role: (asPlainString(src.role) as UserProfileResponseDto["role"]) ?? "USER",
    status:
      (asPlainString(src.status) as UserProfileResponseDto["status"]) ??
      "ACTIVE",
    isEmailVerified: Boolean(src.isEmailVerified),
    isPhoneVerified: Boolean(src.isPhoneVerified),
    createdAt: asPlainString(src.createdAt) ?? new Date().toISOString(),
    profile: (src.profile as UserProfileResponseDto["profile"]) ?? null,
  };
}

export async function updateMyProfile(
  payload: UpdateProfileDto,
): Promise<UserProfileResponseDto> {
  await apiClient.put("/user/profile", payload);
  // swagger گاهی فقط { success: true } برمی‌گرداند
  return getMyProfile();
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}
