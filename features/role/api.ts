import { apiClient } from "@/lib/api/client";
import type {
  CityItem,
  CreateCoachPayload,
  CreateStorePayload,
  ProvinceItem,
  RoleRequestResult,
} from "./types";

/** Latin slug; Persian names fall back to coach-{suffix} */
export function toCoachSlug(text: string, userId: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const idPart =
    userId.replace(/[^a-z0-9]/gi, "").slice(0, 8) || Date.now().toString(36);

  if (base.length >= 2) {
    return `${base}-${idPart.slice(0, 6)}`;
  }

  return `coach-${idPart}`;
}

/** year → ISO required by CreateCoachDto.experienceYears */
export function yearToExperienceIso(year: number): string {
  const y = Math.max(
    1970,
    Math.min(new Date().getFullYear(), Math.floor(year)),
  );
  return `${y}-01-01T00:00:00.000Z`;
}

function asString(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return null;
}

/**
 * POST /user/coach — CreateCoachDto
 * فقط فیلدهایی که کاربر مجاز به ارسال است.
 */
export async function requestCoachRole(
  userId: string,
  payload: CreateCoachPayload = {},
): Promise<RoleRequestResult> {
  if (!userId || typeof userId !== "string") {
    throw new Error("userId خالی است");
  }

  const title =
    payload.title?.trim() || payload.headline?.trim() || "مربی فیتنس";

  const slug =
    (payload.slug?.trim() &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug.trim())
      ? payload.slug.trim()
      : null) || toCoachSlug(title, userId);

  // مطابق CreateCoachDto — بدون commissionRate / rejectionReason
  const body: Record<string, unknown> = {
    userId,
    title,
    slug,
    headline: payload.headline?.trim() || title,
    bio: payload.bio ?? "",
    isAcceptingClients: payload.isAcceptingClients ?? true,
    maxClients: payload.maxClients ?? 20,
    status: "PENDING",
  };

  if (payload.experienceYears) {
    body.experienceYears = payload.experienceYears;
  }
  if (payload.instagram?.trim()) {
    body.instagram = payload.instagram.trim().replace(/^@/, "");
  }
  if (payload.nationalId?.trim()) {
    body.nationalId = payload.nationalId.trim();
  }
  if (payload.provinceId?.trim()) {
    body.provinceId = payload.provinceId.trim();
  }
  if (payload.cityId?.trim()) {
    body.cityId = payload.cityId.trim();
  }
  if (payload.addressId?.trim()) {
    body.addressId = payload.addressId.trim();
  }
  if (payload.banner && payload.banner.length > 0) {
    body.banner = payload.banner.slice(0, 10);
  }

  const { data } = await apiClient.post<RoleRequestResult>("/user/coach", body);
  return data;
}

export async function requestStoreRole(
  userId: string,
  payload: CreateStorePayload,
): Promise<RoleRequestResult> {
  if (!userId) throw new Error("userId خالی است");
  if (!payload.name?.trim()) throw new Error("نام فروشگاه الزامی است");
  if (!payload.slug?.trim()) throw new Error("slug الزامی است");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug.trim())) {
    throw new Error("slug باید فقط حروف کوچک انگلیسی، عدد و خط تیره باشد");
  }

  const { data } = await apiClient.post<RoleRequestResult>("/user/store", {
    name: payload.name.trim(),
    slug: payload.slug.trim(),
    userId,
    hasPhysicalStore: false,
    businessType: payload.businessType ?? "INDIVIDUAL",
    description: payload.description ?? "",
    phone: payload.phone,
    email: payload.email,
    address: payload.address,
  });
  return data;
}

/** GET /province */
export async function fetchProvinces(): Promise<ProvinceItem[]> {
  const { data } = await apiClient.get("/province");
  const root = (data ?? {}) as Record<string, unknown>;
  const list =
    (Array.isArray(root.province) && root.province) ||
    (Array.isArray(root.data) && root.data) ||
    (Array.isArray(root) && root) ||
    [];

  return (list as unknown[])
    .map((raw) => {
      const r = (raw ?? {}) as Record<string, unknown>;
      const id = asString(r.id);
      const name = asString(r.name);
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((x): x is ProvinceItem => x !== null);
}

/** GET /province/city?provinceId=... */
export async function fetchCities(provinceId?: string): Promise<CityItem[]> {
  const { data } = await apiClient.get("/province/city", {
    params: provinceId ? { provinceId } : undefined,
  });
  const root = (data ?? {}) as Record<string, unknown>;
  const list =
    (Array.isArray(root.city) && root.city) ||
    (Array.isArray(root.cities) && root.cities) ||
    (Array.isArray(root.data) && root.data) ||
    (Array.isArray(root) && root) ||
    [];

  return (list as unknown[])
    .map((raw) => {
      const r = (raw ?? {}) as Record<string, unknown>;
      const id = asString(r.id);
      const name = asString(r.name);
      const pId = asString(r.provinceId) || provinceId || "";
      if (!id || !name) return null;
      return { id, name, provinceId: pId };
    })
    .filter((x): x is CityItem => x !== null);
}
