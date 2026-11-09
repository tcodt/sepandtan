"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { SellerShell } from "@/components/seller/seller-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useSellerAccessGuard } from "@/hooks/use-seller-access-guard";
import { setAccessToken } from "@/lib/api/client";
import { useUserStore } from "@/lib/store/user-store";

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useRequireAuth({
    allowedRoles: ["seller", "admin"],
    requireOnboarding: false,
  });

  useSellerAccessGuard(Boolean(isAuthenticated && !isLoading));

  useEffect(() => {
    if (isLoading || !user) return;

    if (user.accountStatus === "SUSPENDED") {
      setAccessToken(null);
      useUserStore.getState().logout();
      router.replace("/login?reason=suspended");
      return;
    }
    if (user.accountStatus === "DELETED") {
      setAccessToken(null);
      useUserStore.getState().logout();
      router.replace("/login?reason=deleted");
      return;
    }
    if (user.role !== "seller" && user.role !== "admin") {
      router.replace("/login?reason=seller_revoked");
    }
  }, [isLoading, user, router]);

  if (
    user?.accountStatus === "SUSPENDED" ||
    user?.accountStatus === "DELETED"
  ) {
    return null;
  }

  if (isLoading || !isAuthenticated || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
            aria-hidden
          />
          <p className="text-xs text-muted-foreground">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "seller" && user.role !== "admin") {
    return null;
  }

  if (user.role === "seller" && user.roleStatus !== "approved") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <h2 className="text-base font-bold">دسترسی فروشنده فعال نیست</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            وضعیت نقش: {user.roleStatus}
          </p>
        </div>
      </div>
    );
  }

  return <SellerShell>{children}</SellerShell>;
}
