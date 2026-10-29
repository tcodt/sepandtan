import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { ApiErrorBody } from "@/lib/types/api";

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://localhost:3001";

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

const TOKEN_KEY = "sepandtan_access_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorBody>) => {
    if (error.response?.status === 401) {
      setAccessToken(null);
      // ریدایرکت را در لایه UI / store مدیریت می‌کنیم تا SSR نشکند
    }
    return Promise.reject(error);
  },
);

/** پیام خطای خوانا از پاسخ بک‌اند */
export function getErrorMessage(
  error: unknown,
  fallback = "خطایی رخ داد",
): string {
  if (!axios.isAxiosError(error)) {
    if (error instanceof Error) return error.message;
    return fallback;
  }

  const data = error.response?.data;
  if (!data) return error.message || fallback;

  if (typeof data.message === "string") return data.message;
  if (Array.isArray(data.message)) return data.message.join("، ");
  if (typeof data.error === "string") return data.error;

  return fallback;
}

// سازگاری با کدهای قدیمی فیک (موقتاً)
export function delay(ms = 40): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export { BASE_URL };
