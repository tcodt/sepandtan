"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Clock,
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  CalendarClock,
  UserRound,
  LogOut,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useUserStore } from "@/lib/store/user-store";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const formatFaDate = (d: Date) =>
  new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);

const addBusinessDays = (from: Date, days: number): Date => {
  const d = new Date(from);
  let added = 0;
  while (added < days) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay(); // 0=Sun, 5=Fri, 6=Sat (weekend in Iran)
    if (day !== 5 && day !== 6) added++;
  }
  return d;
};

/* -------------------------------------------------------------------------- */
/* Stepper                                                                    */
/* -------------------------------------------------------------------------- */

const Stepper = () => {
  const steps = [
    { key: "submitted", label: "ثبت درخواست", state: "done" as const },
    { key: "review", label: "در حال بررسی", state: "active" as const },
    { key: "approved", label: "تأیید و شروع", state: "upcoming" as const },
  ];

  return (
    <ol
      className="flex items-start justify-between gap-2"
      aria-label="مراحل بررسی"
    >
      {steps.map((step, i) => (
        <li
          key={step.key}
          className="relative flex flex-1 flex-col items-center"
        >
          {/* Connector */}
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={`absolute top-4 h-0.5 w-full translate-x-1/2 ${
                step.state === "done" ? "bg-primary" : "bg-border"
              }`}
              style={{ right: "50%", left: "-50%" }}
            />
          )}

          {/* Node */}
          <span
            className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ring-4 ring-background ${
              step.state === "done"
                ? "bg-primary text-primary-foreground"
                : step.state === "active"
                  ? "bg-primary/10 text-primary ring-primary/10"
                  : "bg-muted text-muted-foreground"
            }`}
          >
            {step.state === "done" ? (
              <Check className="h-4 w-4" strokeWidth={3} />
            ) : step.state === "active" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
          </span>

          {/* Label */}
          <span
            className={`mt-2 text-center text-[11px] font-medium leading-4 ${
              step.state === "active"
                ? "text-foreground"
                : step.state === "done"
                  ? "text-foreground/70"
                  : "text-muted-foreground"
            }`}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  );
};

/* -------------------------------------------------------------------------- */
/* Info row                                                                   */
/* -------------------------------------------------------------------------- */

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
      {icon}
    </span>
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold leading-5 text-foreground">
        {value}
      </p>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

const PendingSkeleton = () => (
  <div className="w-full max-w-md animate-pulse space-y-4" aria-busy="true">
    <div className="h-40 rounded-2xl border border-border bg-card" />
    <div className="h-28 rounded-2xl border border-border bg-card" />
    <div className="h-12 rounded-xl bg-muted" />
  </div>
);

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function RolePendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "coach";
  const reduceMotion = useReducedMotion();

  const { isLoading, isAuthenticated, user } = useRequireAuth({
    blockPending: false,
  });

  const logout = useUserStore((s) => s.logout);

  /* ---------- Redirect approved users — moved out of render ---------- */
  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (user?.roleStatus !== "approved") return;

    if (user.role === "coach") {
      router.replace("/coach");
    } else if (user.role === "trainee") {
      router.replace(
        user.onboardingStatus === "completed" ? "/dashboard" : "/onboarding",
      );
    } else {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  /* ---------- Loading ---------- */
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <PendingSkeleton />
      </div>
    );
  }

  const isCoach = type === "coach" || user?.role === "coach";
  const roleLabel = isCoach ? "مربیگری" : "فروشندگی";
  const estimated = addBusinessDays(new Date(), 3);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-400/5"
      />

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        {/* Card — hand-assembled since we no longer need Card primitives */}
        <div className="rounded-3xl border border-border bg-card/80 shadow-xl shadow-black/5 backdrop-blur-md">
          {/* Header */}
          <div className="space-y-3 border-b border-border px-6 pb-5 pt-6 text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
              <Clock className="h-3 w-3" />
              در حال بررسی
            </span>

            <h1 className="text-xl font-bold leading-7 text-foreground">
              درخواست {roleLabel} شما در حال بررسی است
            </h1>
            <p className="text-sm leading-6 text-muted-foreground">
              درخواست شما با موفقیت ثبت شد و تیم سپندتن در حال بررسی آن است.
            </p>
          </div>

          {/* Body */}
          <div className="space-y-5 px-6 py-5">
            <Stepper />

            <div className="space-y-2">
              <InfoRow
                icon={<CalendarClock className="h-4 w-4" />}
                label="زمان تقریبی بررسی"
                value={`تا ${formatFaDate(estimated)} (۱ تا ۳ روز کاری)`}
              />
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="نحوه اطلاع‌رسانی"
                value="اعلان داخل اپ و ایمیل ثبت‌شده"
              />
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="در این مدت"
                value="با نقش ورزشکار می‌توانید از امکانات استفاده کنید"
              />
            </div>

            {/* CTAs */}
            <div className="space-y-2 pt-1">
              <Button
                className="group w-full"
                onClick={() => router.replace("/dashboard")}
              >
                بازگشت به داشبورد
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.replace("/support")}
              >
                سؤال دارم، تماس با پشتیبانی
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Subtle logout */}
            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <LogOut className="h-3 w-3" />
                خروج از حساب
              </button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          نتیجه بررسی از طریق اعلان و ایمیل به شما اطلاع داده می‌شود.
        </p>
      </motion.div>
    </div>
  );
}
