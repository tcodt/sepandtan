import { apiClient } from "@/lib/api/client";
import type {
  CreateCoachPayload,
  CreateStorePayload,
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

/**
 * POST /user/coach
 * CreateCoachDto requires: userId (UUID string in body), title, slug
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

  if (payload.nationalId) body.nationalId = payload.nationalId;
  if (payload.instagram) body.instagram = payload.instagram;
  if (payload.experienceYears != null) {
    body.experienceYears = payload.experienceYears;
  }

  // IMPORTANT: userId only in body — not as query param
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
