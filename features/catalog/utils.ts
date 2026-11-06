import type { PaginationMeta } from "./types";

/** پایه CDN طبق توضیح swagger */
export const MEDIA_CDN_BASE =
  process.env.NEXT_PUBLIC_MEDIA_CDN_URL?.replace(/\/$/, "") ||
  "https://c333224.parspack.net";

export function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (value && typeof value === "object" && "value" in value) {
    return asString((value as { value: unknown }).value);
  }
  return null;
}

export function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (
    typeof value === "string" &&
    value.trim() &&
    !Number.isNaN(Number(value))
  ) {
    return Number(value);
  }
  return null;
}

export function asArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") {
    const r = raw as Record<string, unknown>;
    const candidate =
      r.data ??
      r.items ??
      r.results ??
      r.category ?? // ← مهم برای /categories/admin
      r.categories ??
      r.brands ??
      r.colors ??
      r.media ??
      r.products ??
      r.list;
    if (Array.isArray(candidate)) return candidate;
  }
  return [];
}

export function mapPagination(raw: unknown): PaginationMeta {
  const r = (raw ?? {}) as Record<string, unknown>;
  return {
    total: asNumber(r.total) ?? 0,
    nextPage: asNumber(r.nextPage),
    prevPage: asNumber(r.prevPage),
  };
}

/**
 * url ممکن است relative باشد (marketino/images/...)
 * یا absolute.
 */
export function resolveMediaUrl(pathOrUrl: string | null | undefined): string {
  if (!pathOrUrl) return "";
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.replace(/^\//, "");
  return `${MEDIA_CDN_BASE}/${path}`;
}

/**
 * فقط لاتین a-z / 0-9 / -
 * نام فارسی → اسلاگ خالی نشود (fallback زمانی)
 */
export function toSlug(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    // فاصله و زیرخط → -
    .replace(/[\s_]+/g, "-")
    // حذف هر چیز غیر لاتین/عدد/خط تیره (از جمله فارسی)
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (base.length >= 2) return base;

  // اگر نام فقط فارسی بود
  return `cat-${Date.now().toString(36)}`;
}
