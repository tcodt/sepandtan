"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { requestCoachRole, requestStoreRole, toCoachSlug } from "../api";
import type { CreateCoachPayload, CreateStorePayload } from "../types";
import { getErrorMessage } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";
import { canRequestProfessionalRole } from "@/lib/role-lock";
import { clearRoleFlowIntent } from "@/lib/auth/resolve-post-auth-path";

function toSlug(text: string): string {
  const base = text
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (base.length >= 2) return base;
  return `store-${Date.now().toString(36)}`;
}

export function useRequestCoachRole() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const requestRole = useUserStore((s) => s.requestRole);

  return useMutation({
    mutationFn: (payload: CreateCoachPayload = {}) => {
      if (!user?.id) throw new Error("کاربر یافت نشد");

      const gate = canRequestProfessionalRole(user, "coach");
      if (!gate.ok) throw new Error(gate.message);

      const title =
        payload.title?.trim() ||
        user.name?.trim() ||
        payload.headline?.trim() ||
        "مربی فیتنس";

      const slug = payload.slug?.trim() || toCoachSlug(title, user.id);

      return requestCoachRole(user.id, {
        ...payload,
        title,
        slug,
        headline: payload.headline?.trim() || title,
        bio: payload.bio ?? "",
        isAcceptingClients: payload.isAcceptingClients ?? true,
        maxClients: payload.maxClients ?? 20,
      });
    },
    onSuccess: () => {
      clearRoleFlowIntent();
      requestRole("coach");
      toast.success("درخواست مربیگری ثبت شد", {
        description: "بعد از بررسی ادمین نتیجه اعلام می‌شود.",
      });
      router.replace("/role-pending?type=coach");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ثبت درخواست مربیگری ناموفق بود"));
    },
  });
}

export function useRequestStoreRole() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const requestRole = useUserStore((s) => s.requestRole);

  return useMutation({
    mutationFn: (payload?: Partial<CreateStorePayload>) => {
      if (!user?.id) throw new Error("کاربر یافت نشد");

      const gate = canRequestProfessionalRole(user, "seller");
      if (!gate.ok) throw new Error(gate.message);

      const name = payload?.name?.trim() || user.name?.trim() || "فروشگاه من";

      const slug =
        (payload?.slug?.trim() &&
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug.trim())
          ? payload.slug.trim()
          : null) ||
        toSlug(name) ||
        `store-${user.id.replace(/[^a-z0-9]/gi, "").slice(0, 8) || Date.now().toString(36)}`;

      return requestStoreRole(user.id, {
        name,
        slug,
        description: payload?.description ?? "",
        phone: payload?.phone,
        email: payload?.email,
        address: payload?.address,
        businessType: payload?.businessType ?? "INDIVIDUAL",
      });
    },
    onSuccess: () => {
      clearRoleFlowIntent();
      requestRole("seller");
      toast.success("درخواست فروشندگی ثبت شد", {
        description: "بعد از بررسی ادمین نتیجه اعلام می‌شود.",
      });
      router.replace("/role-pending?type=seller");
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "ثبت درخواست فروشندگی ناموفق بود"));
    },
  });
}
