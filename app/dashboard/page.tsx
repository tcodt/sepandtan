"use client";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function DashboardPage() {
  const { isLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: true,
  });

  // تا hydrate و چک auth تمام نشده چیزی نشان نده
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return <DashboardShell />;
}
