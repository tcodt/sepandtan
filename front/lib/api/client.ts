/**
 * Fake in-memory client
 * - هیچ fetch / axios / NEXT_PUBLIC_API_URL ندارد
 * - فقط برای سازگاری امضاها نگه داشته شده
 * - بعداً می‌توان این فایل را با axios واقعی عوض کرد
 */

export const BASE_URL = "";

/** تأخیر کوتاه برای شبیه‌سازی شبکه (قابل حذف) */
export function delay(ms = 40): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
