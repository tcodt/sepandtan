"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function DashboardPage() {
  const router = useRouter();

  const { isLoading, isAuthenticated, user } = useRequireAuth({
    requireOnboarding: true, // trainee باید آنبوردینگ را تمام کرده باشد
    blockCoach: true, // مربی اینجا نیاید
    blockPending: true, // pending هم اینجا نیاید
  });

  // هدایت به Welcome اگر هنوز ندیده
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    try {
      const seen = localStorage.getItem("sepandtan-welcome-seen");
      if (seen === "0") {
        router.replace("/welcome");
      }
    } catch {
      // ignore
    }
  }, [isLoading, isAuthenticated, router]);

  // تا وقتی وضعیت مشخص نشده، لودینگ
  if (
    isLoading ||
    !isAuthenticated ||
    !user ||
    user.role === "coach" ||
    user.roleStatus !== "approved"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <DashboardShell />;
}
