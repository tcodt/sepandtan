"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MyRequestsList } from "@/components/coaches/my-requests-list";
import { useRequireAuth } from "@/hooks/use-require-auth";

export default function MyRequestsPage() {
  const { isLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: true,
  });

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg sm:max-w-2xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8 space-y-5">
        <header className="flex items-start gap-2">
          <Link
            href="/coaches"
            className="mt-0.5 p-2 -mr-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="بازگشت به مربیان"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              درخواست‌های من
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              وضعیت درخواست‌های همکاری با مربیان
            </p>
          </div>
        </header>

        <MyRequestsList />
      </div>
    </div>
  );
}
