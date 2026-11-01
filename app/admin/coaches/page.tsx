"use client";

import Link from "next/link";
import {
  UserCheck,
  Sparkles,
  Clock,
  ArrowRight,
  LayoutDashboard,
  BellRing,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*                                 Page                                       */
/* -------------------------------------------------------------------------- */

export default function AdminCoachesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 py-6 sm:py-10">
      <Empty
        className={cn(
          "rounded-2xl border border-dashed border-border bg-card/60 p-6 sm:p-10",
          "shadow-sm",
        )}
      >
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          >
            <UserCheck className="h-8 w-8" aria-hidden="true" />
          </EmptyMedia>

          <EmptyTitle className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            بخش مربیان به‌زودی فعال می‌شود
          </EmptyTitle>

          <EmptyDescription className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            زیرساخت این بخش در حال تکمیل است. پس از آماده شدن، می‌توانید
            درخواست‌های مربیگری را اینجا تأیید، رد یا معلق کنید.
          </EmptyDescription>
        </EmptyHeader>

        {/* Status chips */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <StatusChip icon={Clock} label="در حال توسعه" tone="amber" />
          <StatusChip icon={Sparkles} label="به‌زودی" tone="emerald" />
          <StatusChip icon={BellRing} label="اطلاع‌رسانی خواهد شد" tone="sky" />
        </div>

        <EmptyContent className="mt-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button asChild variant="default">
              <Link href="/admin">
                <LayoutDashboard className="me-2 h-4 w-4" aria-hidden="true" />
                بازگشت به داشبورد
                <ArrowRight
                  className="ms-2 h-4 w-4 rtl:rotate-180"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/users">
                <UserCheck className="me-2 h-4 w-4" aria-hidden="true" />
                مدیریت کاربران
              </Link>
            </Button>
          </div>
        </EmptyContent>
      </Empty>

      {/* Footer note */}
      <p className="text-center text-xs text-muted-foreground">
        برای اطلاع از زمان راه‌اندازی، کانال‌های رسمی سپندتن را دنبال کنید.
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Status chip                                   */
/* -------------------------------------------------------------------------- */

function StatusChip({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "amber" | "emerald" | "sky";
}) {
  const tones: Record<typeof tone, string> = {
    amber:
      "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    emerald:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    sky: "border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        tones[tone],
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
