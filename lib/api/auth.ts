import { apiClient, setAccessToken, getAccessToken } from "@/lib/api/client";
import type {
  AuthEntities,
  LoginDto,
  RegisterDto,
  UserProfileResponseDto,
} from "@/lib/types/api";

function extractToken(data: AuthEntities): string | null {
  return data.accessToken ?? data.token ?? null;
}

export async function loginRequest(dto: LoginDto): Promise<AuthEntities> {
  const { data } = await apiClient.post<AuthEntities>("/auth/login", dto);
  const token = extractToken(data);
  if (token) setAccessToken(token);
  return data;
}

export async function registerRequest(dto: RegisterDto): Promise<AuthEntities> {
  const { data } = await apiClient.post<AuthEntities>("/auth/register", dto);
  const token = extractToken(data);
  if (token) setAccessToken(token);
  return data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await apiClient.delete("/auth");
  } finally {
    setAccessToken(null);
  }
}

/** پروفایل کاربر لاگین‌شده */
export async function getMyProfile(): Promise<UserProfileResponseDto> {
  const { data } = await apiClient.get<UserProfileResponseDto>("/user/profile");
  return data;
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken());
}
