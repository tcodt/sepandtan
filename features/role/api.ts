import { apiClient } from "@/lib/api/client";
import type {
  CreateCoachPayload,
  CreateStorePayload,
  RoleRequestResult,
} from "./types";

export async function requestCoachRole(
  userId: string,
  payload: CreateCoachPayload = {},
): Promise<RoleRequestResult> {
  if (!userId) throw new Error("userId خالی است");

  const { data } = await apiClient.post<RoleRequestResult>(
    "/user/coach",
    {
      status: "PENDING",
      isAcceptingClients: payload.isAcceptingClients ?? true,
      headline: payload.headline ?? "مربی فیتنس",
      bio: payload.bio ?? "",
      maxClients: payload.maxClients ?? 20,
    },
    { params: { userId } },
  );
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

  const { data } = await apiClient.post<RoleRequestResult>(
    "/user/store",
    {
      name: payload.name.trim(),
      slug: payload.slug.trim(),
      userId,
      hasPhysicalStore: false,
      businessType: payload.businessType ?? "INDIVIDUAL",
      description: payload.description ?? "",
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
    },
    { params: { userId } },
  );
  return data;
}
