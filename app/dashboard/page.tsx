"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function DashboardPage() {
  const router = useRouter();
  const { isLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: true,
  });

  // اگر اولین ورود بعد از آنبوردینگ باشد → Welcome
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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <DashboardShell />;
}
