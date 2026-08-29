"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText } from "lucide-react";
import { CoachesList } from "@/components/coaches/coaches-list";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useUserStore } from "@/lib/store/user-store";
import { getMyCollaborationRequests } from "@/lib/api/coaches";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CoachesPage() {
  const { isLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: true,
  });
  const user = useUserStore((s) => s.user);
  const [requestCount, setRequestCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    getMyCollaborationRequests(user.id)
      .then((list) => {
        if (!cancelled) {
          // فقط درخواست‌های فعال (pending) را بشمار — یا همه را، هر کدام ترجیح می‌دهی
          const active = list.filter((r) => r.status === "pending").length;
          setRequestCount(active);
        }
      })
      .catch(() => {
        if (!cancelled) setRequestCount(0);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const badge =
    requestCount !== null && requestCount > 0 ? (
      <Badge
        variant="secondary"
        className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary tabular-nums"
      >
        {requestCount.toLocaleString("fa-IR")}
      </Badge>
    ) : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        <header className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="p-2 -mr-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors flex-shrink-0"
            aria-label="بازگشت"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground truncate">
              مربیان سپندتن
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
              مربی تأییدشده پیدا کن و درخواست همکاری بده
            </p>
          </div>

          {/* Desktop */}
          <Link href="/coaches/requests" className="hidden sm:block">
            <Button
              variant="outline"
              size="default"
              className="gap-2 border-border/60 bg-card/50 hover:bg-card hover:border-primary/40 transition-all duration-200 shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>درخواست‌های من</span>
              {badge}
            </Button>
          </Link>
        </header>

        {/* Mobile */}
        <div className="sm:hidden flex justify-end -mt-1">
          <Link href="/coaches/requests">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 border-border/60 bg-card/50 hover:bg-card hover:border-primary/40 transition-all text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>درخواست‌ها</span>
              {badge}
            </Button>
          </Link>
        </div>

        <div className="w-full">
          <CoachesList />
        </div>
      </div>
    </div>
  );
}
