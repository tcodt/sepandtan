"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Dumbbell, Apple, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUserStore, type Goal } from "@/lib/store/user-store";
import { useUserPlan } from "@/hooks/use-user-plan";
import { cn } from "@/lib/utils";

const GOAL_LABELS: Record<Goal, string> = {
  lose_weight: "کاهش وزن",
  build_muscle: "عضله‌سازی",
  maintain: "حفظ تناسب",
  endurance: "استقامت",
  general_fitness: "آمادگی عمومی",
};

type Status = "preparing" | "ready" | "error";

export function WelcomeFirstActionScreen() {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const { plan, isLoading, error, hasPlan } = useUserPlan();
  const [status, setStatus] = useState<Status>("preparing");

  useEffect(() => {
    if (isLoading) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus("preparing");
      return;
    }
    if (error) {
      setStatus("error");
      return;
    }
    if (hasPlan || plan) {
      setStatus("ready");
      return;
    }
    setStatus("preparing");
  }, [isLoading, error, hasPlan, plan]);

  // فلگ اولین ورود بعد از آنبوردینگ
  useEffect(() => {
    try {
      localStorage.setItem("sepandtan-welcome-seen", "1");
    } catch {
      // ignore
    }
  }, []);

  const name = user?.name?.trim() || "";
  const greeting = name ? `سلام ${name}!` : "سلام!";
  const goalLabel = user?.goal ? GOAL_LABELS[user.goal] : null;

  const handleRetry = () => {
    if (user?.currentPlanId) {
      window.location.reload();
    } else {
      router.replace("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header minimal */}
      <header className="px-4 pt-6 pb-2 flex items-center justify-center">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-5 h-5" aria-hidden />
          <span className="text-sm font-medium">سپندتن</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-10">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="w-full max-w-md space-y-8 text-center"
        >
          {/* Personalized Greeting */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {greeting} آماده‌ای شروع کنی؟
            </h1>
            {goalLabel ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                برنامه تمرینی و تغذیه‌ات بر اساس هدفت (
                <span className="font-medium text-foreground">{goalLabel}</span>
                ) آماده شده.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                برنامه تمرینی و تغذیه‌ات آماده شده.
              </p>
            )}
          </div>

          {/* Status Card */}
          <div
            className={cn(
              "rounded-2xl border p-5 text-right",
              status === "ready" && "border-primary/30 bg-primary/5",
              status === "preparing" && "border-border bg-card/80",
              status === "error" && "border-destructive/30 bg-destructive/5",
            )}
            role="status"
            aria-live="polite"
          >
            {status === "preparing" && (
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />
                <p className="text-sm text-muted-foreground">
                  در حال آماده‌سازی برنامه شخصی‌سازی‌شده‌ات هستیم...
                </p>
              </div>
            )}
            {status === "ready" && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    برنامه‌ات آماده‌ست
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    می‌تونی از همین الان تمرین یا تغذیه امروز رو ببینی.
                  </p>
                </div>
              </div>
            )}
            {status === "error" && (
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm text-foreground">
                    مشکلی پیش اومد. دوباره امتحان کن
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRetry}
                    className="h-9"
                  >
                    تلاش مجدد
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* CTAs */}
          <div className="space-y-3 pt-2">
            <Button
              asChild
              size="lg"
              className="w-full h-12 text-base font-semibold"
              disabled={status === "preparing"}
              aria-label="مشاهده تمرین امروز"
            >
              <Link href="/workout/today">
                <Dumbbell className="w-5 h-5" />
                مشاهده تمرین امروز
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full h-12 text-base"
              disabled={status === "preparing"}
              aria-label="تغذیه امروز"
            >
              <Link href="/nutrition">
                <Apple className="w-5 h-5" />
                تغذیه امروز
              </Link>
            </Button>

            <button
              type="button"
              onClick={() => router.replace("/dashboard")}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2 min-h-12"
            >
              بعداً می‌بینم
            </button>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
