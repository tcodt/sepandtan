"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CoachProfile } from "@/components/coaches/coach-profile";
import { EmptyState } from "@/components/common/empty-state";
import { getCoachById } from "@/lib/api/coaches";
import { useRequireAuth } from "@/hooks/use-require-auth";
import type { Coach } from "@/lib/types/coach";

export default function CoachDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";

  const { isLoading: authLoading, isAuthenticated } = useRequireAuth({
    requireOnboarding: true,
  });

  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || authLoading || !isAuthenticated) return;

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCoachById(id);
        if (!cancelled) setCoach(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("مربی پیدا نشد یا خطایی رخ داد.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, authLoading, isAuthenticated]);

  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2
          className="w-8 h-8 animate-spin text-primary"
          aria-label="در حال بارگذاری"
        />
      </div>
    );
  }

  if (error || !coach) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <EmptyState
          title="مربی پیدا نشد"
          description={error ?? "این پروفایل در دسترس نیست."}
          actionLabel="بازگشت به لیست مربیان"
          actionHref="/coaches"
        />
      </div>
    );
  }

  return <CoachProfile coach={coach} />;
}
