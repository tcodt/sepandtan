"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { CoachShell } from "@/components/coach/coach-shell";
import { CoachMobileNav } from "@/components/coach/coach-mobile-nav";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: false,
    blockPending: false, // خودمان در useEffect مدیریت می‌کنیم
    allowedRoles: ["coach"],
  });

  useEffect(() => {
    if (isLoading) return;

    // لاگین نکرده
    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // نقش مربی نیست
    if (user.role !== "coach") {
      router.replace("/dashboard");
      return;
    }

    // مربی هست اما هنوز تأیید نشده
    if (user.roleStatus !== "approved") {
      router.replace(`/role-pending?type=coach`);
      return;
    }
  }, [isLoading, isAuthenticated, user, router]);

  // تا وقتی وضعیت مشخص نشده، لودینگ نشان بده
  if (
    isLoading ||
    !isAuthenticated ||
    !user ||
    user.role !== "coach" ||
    user.roleStatus !== "approved"
  ) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <CoachShell user={user}>{children}</CoachShell>
      <CoachMobileNav user={user} />
    </>
  );
}
