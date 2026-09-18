"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { CoachShell } from "@/components/coach/coach-shell";

export default function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: false, // مربی ممکن است onboarding کاربر را رد کرده باشد
  });

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated || !user) {
      router.replace("/login");
      return;
    }

    // فقط role = coach اجازه ورود دارد
    if (user.role !== "coach") {
      router.replace("/dashboard");
      return;
    }

    // اگر verified نباشد (در آینده از CoachProfile چک می‌کنیم)
    // فعلاً فقط role را چک می‌کنیم
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || !user || user.role !== "coach") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <CoachShell user={user}>{children}</CoachShell>;
}
