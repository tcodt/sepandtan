"use client";

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
  RefreshCw,
  CheckCircle2,
  XCircle,
  Ban,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useUserStore } from "@/lib/store/user-store";
import { logoutRequest } from "@/lib/api/auth";
import {
  useRoleStatusSync,
  type RoleSyncState,
} from "@/features/role/hooks/use-role-status-sync";

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
    const day = d.getDay();
    if (day !== 5 && day !== 6) added++;
  }
  return d;
};

function getDashboardHref(role?: string) {
  if (role === "coach") return "/coach";
  if (role === "admin") return "/admin";
  if (role === "seller") return "/dashboard";
  return "/dashboard";
}

/* -------------------------------------------------------------------------- */
/* Stepper                                                                    */
/* -------------------------------------------------------------------------- */

function Stepper({ state }: { state: RoleSyncState }) {
  const steps = [
    {
      key: "submitted",
      label: "ثبت درخواست",
      state: "done" as const,
    },
    {
      key: "review",
      label: "در حال بررسی",
      state: state === "pending" ? ("active" as const) : ("done" as const),
    },
    {
      key: "result",
      label:
        state === "rejected"
          ? "رد شد"
          : state === "suspended"
            ? "معلق"
            : state === "approved"
              ? "تأیید شد"
              : "تأیید و شروع",
      state:
        state === "pending"
          ? ("upcoming" as const)
          : state === "approved"
            ? ("done" as const)
            : ("active" as const),
    },
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
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className={`absolute top-4 h-0.5 w-full translate-x-1/2 ${
                step.state === "done" ? "bg-primary" : "bg-border"
              }`}
              style={{ right: "50%", left: "-50%" }}
            />
          )}

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
            ) : step.state === "active" && state === "pending" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step.state === "active" && state === "rejected" ? (
              <XCircle className="h-4 w-4 text-destructive" />
            ) : step.state === "active" && state === "suspended" ? (
              <Ban className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
          </span>

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
}

/* -------------------------------------------------------------------------- */
/* Info row                                                                   */
/* -------------------------------------------------------------------------- */

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
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
}

/* -------------------------------------------------------------------------- */
/* Skeleton                                                                   */
/* -------------------------------------------------------------------------- */

function PendingSkeleton() {
  return (
    <div className="w-full max-w-md animate-pulse space-y-4" aria-busy="true">
      <div className="h-40 rounded-2xl border border-border bg-card" />
      <div className="h-28 rounded-2xl border border-border bg-card" />
      <div className="h-12 rounded-xl bg-muted" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Result banners                                                             */
/* -------------------------------------------------------------------------- */

function ResultHeader({
  state,
  roleLabel,
}: {
  state: RoleSyncState;
  roleLabel: string;
}) {
  if (state === "approved") {
    return (
      <div className="space-y-3 border-b border-border px-6 pb-5 pt-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          تأیید شد
        </span>
        <h1 className="text-xl font-bold leading-7 text-foreground">
          درخواست {roleLabel} شما تأیید شد
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          حالا می‌توانید وارد پنل اختصاصی خود شوید. تا لحظاتی دیگر منتقل
          می‌شوید...
        </p>
      </div>
    );
  }

  if (state === "rejected") {
    return (
      <div className="space-y-3 border-b border-border px-6 pb-5 pt-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 px-3 py-1 text-[11px] font-semibold text-rose-700 dark:text-rose-400">
          <XCircle className="h-3 w-3" />
          رد شد
        </span>
        <h1 className="text-xl font-bold leading-7 text-foreground">
          درخواست {roleLabel} رد شد
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          متأسفانه درخواست شما تأیید نشد. می‌توانید دوباره نقش دیگری انتخاب کنید
          یا با پشتیبانی در تماس باشید.
        </p>
      </div>
    );
  }

  if (state === "suspended") {
    return (
      <div className="space-y-3 border-b border-border px-6 pb-5 pt-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
          <Ban className="h-3 w-3" />
          معلق شده
        </span>
        <h1 className="text-xl font-bold leading-7 text-foreground">
          حساب {roleLabel} شما معلق است
        </h1>
        <p className="text-sm leading-6 text-muted-foreground">
          دسترسی شما موقتاً محدود شده است. برای جزئیات با پشتیبانی تماس بگیرید.
        </p>
      </div>
    );
  }

  // pending
  return (
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
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function RolePendingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get("type") || "coach";
  const reduceMotion = useReducedMotion();

  const { isLoading, isAuthenticated } = useRequireAuth({
    blockPending: false,
  });

  const { isChecking, syncState, user, refetch } = useRoleStatusSync(
    !isLoading && isAuthenticated,
  );

  async function handleLogout() {
    try {
      await logoutRequest();
    } finally {
      useUserStore.getState().logout();
      router.replace("/login");
    }
  }

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
        <div className="rounded-3xl border border-border bg-card/80 shadow-xl shadow-black/5 backdrop-blur-md">
          <ResultHeader state={syncState} roleLabel={roleLabel} />

          <div className="space-y-5 px-6 py-5">
            <Stepper state={syncState} />

            {/* محتوای وابسته به state */}
            {syncState === "pending" && (
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
            )}

            {syncState === "approved" && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center text-sm text-emerald-700 dark:text-emerald-400">
                در حال انتقال به پنل شما...
              </div>
            )}

            {syncState === "rejected" && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-center text-sm text-rose-700 dark:text-rose-400">
                می‌توانید نقش دیگری انتخاب کنید یا دوباره درخواست دهید.
              </div>
            )}

            {syncState === "suspended" && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center text-sm text-amber-700 dark:text-amber-400">
                تا رفع تعلیق، دسترسی نقش محدود است.
              </div>
            )}

            {/* دکمه‌ها */}
            <div className="space-y-2 pt-1">
              {syncState === "pending" && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => refetch()}
                  disabled={isChecking}
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      در حال بررسی وضعیت...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      بررسی وضعیت درخواست
                    </>
                  )}
                </Button>
              )}

              {syncState === "approved" && (
                <Button
                  className="w-full"
                  onClick={() => router.replace(getDashboardHref(user?.role))}
                >
                  ورود به پنل
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}

              {(syncState === "rejected" || syncState === "suspended") && (
                <>
                  <Button
                    className="w-full"
                    onClick={() => router.replace("/role-selection")}
                  >
                    انتخاب نقش دوباره
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => router.replace("/support")}
                  >
                    تماس با پشتیبانی
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}

              {syncState === "pending" && (
                <>
                  <Button
                    className="group w-full"
                    onClick={() => router.replace("/")}
                  >
                    بازگشت به خانه
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
                </>
              )}
            </div>

            <div className="flex justify-center pt-1">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <LogOut className="h-3 w-3" />
                خروج از حساب
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          {syncState === "pending"
            ? "این صفحه به‌صورت خودکار وضعیت را چک می‌کند."
            : syncState === "approved"
              ? "تا لحظاتی دیگر به پنل منتقل می‌شوید."
              : "در صورت نیاز با پشتیبانی در تماس باشید."}
        </p>
      </motion.div>
    </div>
  );
}
