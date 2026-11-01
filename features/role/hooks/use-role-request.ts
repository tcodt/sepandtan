"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { requestCoachRole, requestStoreRole } from "../api";
import type { CreateCoachPayload, CreateStorePayload } from "../types";
import { getErrorMessage } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";

function toSlug(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || `store-${Date.now().toString(36)}`
  );
}

export function useRequestCoachRole() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const requestRole = useUserStore((s) => s.requestRole);

  return useMutation({
    mutationFn: (payload: CreateCoachPayload = {}) => {
      if (!user?.id) throw new Error("کاربر یافت نشد");
      return requestCoachRole(user.id, payload);
    },
    onSuccess: () => {
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

      const name = payload?.name?.trim() || user.name?.trim() || "فروشگاه من";
      const slug = payload?.slug?.trim() || toSlug(name);

      return requestStoreRole(user.id, {
        name,
        slug,
        description: payload?.description,
        phone: payload?.phone ?? user.phone,
        email: payload?.email ?? user.email,
        address: payload?.address,
        businessType: payload?.businessType ?? "INDIVIDUAL",
      });
    },
    onSuccess: () => {
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
